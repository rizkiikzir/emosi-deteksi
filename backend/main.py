from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import cv2
import numpy as np
import json
import os
import tensorflow as tf
from tensorflow.keras import layers, models


# ============================================================
# APP SETUP
# ============================================================

app = FastAPI(title="Emosi Deteksi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PATH SETUP
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

WEIGHTS_PATH = os.path.join(
    BASE_DIR,
    "model",
    "lightexnet_v2_random_final.h5"
)

CLASS_NAMES_PATH = os.path.join(
    BASE_DIR,
    "model",
    "class_names.json"
)

INPUT_SHAPE = (48, 48, 1)


# ============================================================
# FACE DETECTOR
# ============================================================

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

if face_cascade.empty():
    raise RuntimeError("Haar Cascade gagal dimuat.")


# ============================================================
# LOAD CLASS NAMES
# ============================================================

def load_class_names():
    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        sorted_items = sorted(data.items(), key=lambda x: int(x[0]))
        return [item[1] for item in sorted_items]

    raise ValueError("Format class_names.json tidak dikenali.")


CLASS_NAMES = load_class_names()
NUM_CLASSES = len(CLASS_NAMES)

print("Class names:", CLASS_NAMES)
print("Weights path:", WEIGHTS_PATH)


# ============================================================
# CUSTOM LAYER: CHANNEL ATTENTION
# ============================================================

@tf.keras.utils.register_keras_serializable()
class ChannelAttention(layers.Layer):
    def __init__(self, ratio=8, **kwargs):
        super().__init__(**kwargs)
        self.ratio = ratio

    def build(self, input_shape):
        channels = int(input_shape[-1])
        hidden = max(channels // self.ratio, 8)

        self.avg_pool = layers.GlobalAveragePooling2D()
        self.max_pool = layers.GlobalMaxPooling2D()

        self.dense1 = layers.Dense(hidden, activation="relu")
        self.dense2 = layers.Dense(channels)

        self.reshape = layers.Reshape((1, 1, channels))
        self.multiply = layers.Multiply()

    def call(self, inputs):
        avg = self.avg_pool(inputs)
        maxv = self.max_pool(inputs)

        avg = self.dense2(self.dense1(avg))
        maxv = self.dense2(self.dense1(maxv))

        attention = tf.nn.sigmoid(avg + maxv)
        attention = self.reshape(attention)

        return self.multiply([inputs, attention])

    def get_config(self):
        config = super().get_config()
        config.update({"ratio": self.ratio})
        return config


# ============================================================
# CUSTOM LAYER: SPATIAL ATTENTION
# ============================================================

@tf.keras.utils.register_keras_serializable()
class SpatialAttention(layers.Layer):
    def __init__(self, kernel_size=7, **kwargs):
        super().__init__(**kwargs)
        self.kernel_size = kernel_size
        self.conv = layers.Conv2D(
            filters=1,
            kernel_size=kernel_size,
            padding="same",
            activation="sigmoid"
        )
        self.multiply = layers.Multiply()

    def call(self, inputs):
        avg_pool = tf.reduce_mean(inputs, axis=-1, keepdims=True)
        max_pool = tf.reduce_max(inputs, axis=-1, keepdims=True)

        concat = tf.concat([avg_pool, max_pool], axis=-1)
        attention = self.conv(concat)

        return self.multiply([inputs, attention])

    def get_config(self):
        config = super().get_config()
        config.update({"kernel_size": self.kernel_size})
        return config


# ============================================================
# ATTENTION BLOCK
# ============================================================

def attention_block(x, name=None):
    x = ChannelAttention(name=None if name is None else name + "_ca")(x)
    x = SpatialAttention(name=None if name is None else name + "_sa")(x)
    return x


# ============================================================
# CONV BN RELU6
# ============================================================

def conv_bn_relu(x, filters, kernel_size=3, strides=1, name=None):
    x = layers.Conv2D(
        filters,
        kernel_size,
        strides=strides,
        padding="same",
        use_bias=False,
        name=None if name is None else name + "_conv"
    )(x)

    x = layers.BatchNormalization(
        name=None if name is None else name + "_bn"
    )(x)

    x = layers.ReLU(
        max_value=6,
        name=None if name is None else name + "_relu6"
    )(x)

    return x


# ============================================================
# INVERTED RESIDUAL BLOCK
# ============================================================

def inverted_residual_block(x, out_channels, expansion=4, stride=1, name=None):
    in_channels = int(x.shape[-1])
    hidden_dim = in_channels * expansion

    shortcut = x

    if expansion != 1:
        x = layers.Conv2D(
            hidden_dim,
            kernel_size=1,
            padding="same",
            use_bias=False,
            name=None if name is None else name + "_expand_conv"
        )(x)

        x = layers.BatchNormalization(
            name=None if name is None else name + "_expand_bn"
        )(x)

        x = layers.ReLU(
            max_value=6,
            name=None if name is None else name + "_expand_relu6"
        )(x)

    x = layers.DepthwiseConv2D(
        kernel_size=3,
        strides=stride,
        padding="same",
        use_bias=False,
        name=None if name is None else name + "_dw_conv"
    )(x)

    x = layers.BatchNormalization(
        name=None if name is None else name + "_dw_bn"
    )(x)

    x = layers.ReLU(
        max_value=6,
        name=None if name is None else name + "_dw_relu6"
    )(x)

    x = layers.Conv2D(
        out_channels,
        kernel_size=1,
        padding="same",
        use_bias=False,
        name=None if name is None else name + "_project_conv"
    )(x)

    x = layers.BatchNormalization(
        name=None if name is None else name + "_project_bn"
    )(x)

    if stride == 1 and in_channels == out_channels:
        x = layers.Add(
            name=None if name is None else name + "_add"
        )([shortcut, x])

    return x


# ============================================================
# BUILD LIGHTEXNET V2
# ============================================================

def build_lightexnet_v2(input_shape=(48, 48, 1), num_classes=5):
    inputs = layers.Input(shape=input_shape)

    # Augmentation layers ikut arsitektur training.
    # Saat inference/predict, layer ini otomatis tidak aktif seperti saat training.
    aug = layers.RandomFlip("horizontal")(inputs)
    aug = layers.RandomRotation(0.06)(aug)
    aug = layers.RandomZoom(0.08)(aug)
    aug = layers.RandomContrast(0.12)(aug)

    # STAGE 0
    x = conv_bn_relu(aug, 32, kernel_size=3, strides=1, name="stage0")

    # Shallow branch awal
    shallow1 = conv_bn_relu(inputs, 16, kernel_size=3, strides=1, name="shallow1_a")
    shallow1 = conv_bn_relu(shallow1, 24, kernel_size=3, strides=1, name="shallow1_b")

    # STAGE 1: 48x48
    x = inverted_residual_block(x, 32, expansion=2, stride=1, name="ir1_1")
    x = inverted_residual_block(x, 32, expansion=2, stride=1, name="ir1_2")
    x = attention_block(x, name="att1")

    # Fusion 1
    x = layers.Concatenate(name="fusion1")([x, shallow1])
    x = conv_bn_relu(x, 48, kernel_size=1, strides=1, name="fusion1_reduce")
    x = attention_block(x, name="att_fusion1")

    # STAGE 2: 24x24
    x = inverted_residual_block(x, 64, expansion=4, stride=2, name="ir2_1")
    x = inverted_residual_block(x, 64, expansion=4, stride=1, name="ir2_2")
    x = attention_block(x, name="att2")

    # Shallow branch 24x24
    shallow2 = layers.AveragePooling2D(pool_size=2)(shallow1)
    shallow2 = conv_bn_relu(shallow2, 32, kernel_size=3, strides=1, name="shallow2")

    # Fusion 2
    x = layers.Concatenate(name="fusion2")([x, shallow2])
    x = conv_bn_relu(x, 80, kernel_size=1, strides=1, name="fusion2_reduce")
    x = attention_block(x, name="att_fusion2")

    # STAGE 3: 12x12
    x = inverted_residual_block(x, 128, expansion=4, stride=2, name="ir3_1")
    x = inverted_residual_block(x, 128, expansion=4, stride=1, name="ir3_2")
    x = inverted_residual_block(x, 128, expansion=4, stride=1, name="ir3_3")
    x = attention_block(x, name="att3")

    # Shallow branch 12x12
    shallow3 = layers.AveragePooling2D(pool_size=2)(shallow2)
    shallow3 = conv_bn_relu(shallow3, 48, kernel_size=3, strides=1, name="shallow3")

    # Fusion 3
    x = layers.Concatenate(name="fusion3")([x, shallow3])
    x = conv_bn_relu(x, 160, kernel_size=1, strides=1, name="fusion3_reduce")
    x = attention_block(x, name="att_fusion3")

    # STAGE 4: 6x6
    x = inverted_residual_block(x, 192, expansion=4, stride=2, name="ir4_1")
    x = inverted_residual_block(x, 192, expansion=4, stride=1, name="ir4_2")
    x = attention_block(x, name="att4")

    # Classifier
    x = layers.Conv2D(
        256,
        kernel_size=1,
        padding="same",
        use_bias=False,
        name="final_conv"
    )(x)

    x = layers.BatchNormalization(name="final_bn")(x)
    x = layers.ReLU(max_value=6, name="final_relu6")(x)

    x = layers.GlobalAveragePooling2D(name="gap")(x)

    x = layers.Dropout(0.45, name="dropout1")(x)
    x = layers.Dense(256, activation="relu", name="fc1")(x)
    x = layers.BatchNormalization(name="fc1_bn")(x)
    x = layers.Dropout(0.35, name="dropout2")(x)

    outputs = layers.Dense(
        num_classes,
        activation="softmax",
        name="predictions"
    )(x)

    model = models.Model(
        inputs,
        outputs,
        name="LightExNet_V2_RandomSplit_5Class_48x48"
    )

    return model


# ============================================================
# LOAD MODEL WEIGHTS
# ============================================================

print("Membangun arsitektur LightExNet V2...")
model = build_lightexnet_v2(INPUT_SHAPE, NUM_CLASSES)

print("Loading weights:", WEIGHTS_PATH)
model.load_weights(WEIGHTS_PATH)

print("Model berhasil dimuat dari weights.")


# ============================================================
# ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Backend Emosi Deteksi aktif",
        "model": "LightExNet V2 Random Final",
        "status": "running",
        "classes": CLASS_NAMES,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        np_arr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {
                "success": False,
                "message": "Gambar tidak valid.",
                "dominant_emotion": "-",
                "confidence": 0,
                "scores": {},
            }

        frame_height, frame_width = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(40, 40),
        )

        if len(faces) == 0:
            return {
                "success": False,
                "message": "Wajah tidak terdeteksi.",
                "dominant_emotion": "Tidak Terdeteksi",
                "confidence": 0,
                "scores": {emotion: 0 for emotion in CLASS_NAMES},
                "frame_size": {
                    "width": int(frame_width),
                    "height": int(frame_height),
                },
                "face_box": None,
            }

        faces = sorted(faces, key=lambda box: box[2] * box[3], reverse=True)
        x, y, w, h = faces[0]

        face_roi = gray[y:y + h, x:x + w]

        face_roi = cv2.resize(face_roi, (48, 48))
        face_roi = face_roi.astype("float32") / 255.0

        input_data = np.expand_dims(face_roi, axis=-1)
        input_data = np.expand_dims(input_data, axis=0)

        predictions = model.predict(input_data, verbose=0)[0]

        predicted_index = int(np.argmax(predictions))
        confidence = float(predictions[predicted_index])
        dominant_emotion = CLASS_NAMES[predicted_index]

        scores = {
            CLASS_NAMES[i]: round(float(predictions[i]), 4)
            for i in range(len(CLASS_NAMES))
        }

        return {
            "success": True,
            "message": "Prediksi berhasil.",
            "dominant_emotion": dominant_emotion,
            "confidence": round(confidence, 4),
            "scores": scores,
            "frame_size": {
                "width": int(frame_width),
                "height": int(frame_height),
            },
            "face_box": {
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
            },
        }

    except Exception as error:
        print("ERROR:", error)
        return {
            "success": False,
            "message": str(error),
            "dominant_emotion": "Error",
            "confidence": 0,
            "scores": {},
            "face_box": None,
        }

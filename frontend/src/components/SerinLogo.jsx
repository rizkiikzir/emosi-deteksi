import serinLogo from "../assets/serin-logo.png";
import serinIcon from "../assets/serin-icon.png";
import logoPnl from "../assets/logo-pnl.png";

function SerinLogo({
  variant = "horizontal",
  showCampus = false,
  className = "",
  imageClassName = "",
  campusClassName = "",
}) {
  const logoSrc = variant === "icon" ? serinIcon : serinLogo;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoSrc}
        alt="SERIN - Emotion Recognition System"
        className={`h-auto object-contain ${imageClassName}`}
      />

      {showCampus && (
        <img
          src={logoPnl}
          alt="Logo Politeknik Negeri Lhokseumawe"
          className={`h-auto object-contain ${campusClassName}`}
        />
      )}
    </div>
  );
}

export default SerinLogo;
export function fotoPendonor(foto?: string | null) {
  if (foto && foto.length > 0) {
    return foto;
  }

  return "/images/default-profile.png";
}
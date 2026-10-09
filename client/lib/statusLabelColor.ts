export const getStatusLabelColorValue = (item: any) =>
  String(
    item?.meshColor ||
      item?.qrBoxColor ||
      item?.meshColorRaw ||
      item?.mesh_color ||
      item?.color ||
      item?.colorType ||
      "",
  ).trim();

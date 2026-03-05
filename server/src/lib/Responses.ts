export const updated = (name: string) => `${name} updated successfully`;
export const created = (name: string) => `${name} created successfully`;
export const deleted = (name: string) => `${name} deleted successfully`;

export const paginator = (
  data: any,
  hasNext: boolean,
  hasPrevious: boolean
) => {
  return {
    data,
    hasNext,
    hasPrevious,
  };
};

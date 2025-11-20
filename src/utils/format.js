export const formatValidationError = errors => {
  if (!errors || !errors.issues) return 'Validation Failed';

  if (Array.isArray(errors))
    return errors.map(error => error.message).join(', ');

  return JSON.stringify(errors);
};

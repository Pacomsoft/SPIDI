export function objectToFormData(obj: Record<string, any>, formData = new FormData(), parentKey = ''): FormData {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const formKey = parentKey ? `${parentKey}[${key}]` : key;
            if (value instanceof Date) {
                formData.append(formKey, value.toISOString());
            } else if (value instanceof File) {
                formData.append(formKey, value);
            } else if (typeof value === 'object' && value !== null) {
                objectToFormData(value, formData, formKey);
            } else {
                formData.append(formKey, value);
            }
        }
    }
    return formData;
}
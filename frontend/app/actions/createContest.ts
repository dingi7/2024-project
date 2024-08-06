"use server"

export async function createContest(formData: FormData) {
  const rawFormData = {
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("start-date"),
    endDate: formData.get("end-date"),
    rulesFile: formData.get("rules-file"),
    otherFiles: formData.get("other-files"),
  };
  console.log(rawFormData);
}

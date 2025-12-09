export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: "Password must be at least 8 characters" }
  if (!/[A-Z]/.test(password)) return { valid: false, error: "Password must contain uppercase" }
  if (!/[a-z]/.test(password)) return { valid: false, error: "Password must contain lowercase" }
  if (!/[0-9]/.test(password)) return { valid: false, error: "Password must contain number" }
  return { valid: true }
}

export function validateProjectData(data: any) {
  const errors: string[] = []

  if (!data.name?.trim()) errors.push("Project name required")
  if (data.budget_total && isNaN(Number(data.budget_total))) errors.push("Budget must be a number")
  if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
    errors.push("Start date must be before end date")
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}

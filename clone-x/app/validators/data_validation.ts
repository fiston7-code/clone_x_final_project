import vine from '@vinejs/vine'

/**
 * Validates the post's creation action
 */
export const accoutValidation = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(50),
    pseudo: vine.string().trim(),
    email: vine.string().trim().email(),
    password: vine.string().trim().minLength(6),
  })
)

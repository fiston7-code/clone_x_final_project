import vine from '@vinejs/vine'

// Validates the post's creation action

export const accoutValidation = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(50),
    pseudo: vine.string().trim(),
    email: vine.string().trim().email(),
    password: vine.string().trim().minLength(6),
  })
)

export const tweetValidation = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(255).optional().nullable(),
    parentId: vine.number().min(1).optional(),
    media: vine
      .file({ extnames: ['jpg', 'png', 'jpeg'], size: '5mb' })
      .optional()
      .nullable(),
  })
)

export const updateUserInfo = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(15).optional(),
    pseudo: vine.string().trim().minLength(3).maxLength(15).optional(),
    bio: vine.string().trim().minLength(3).maxLength(160).optional(), // facultatif mais utile

    current_password: vine.string().trim().minLength(6).optional(), // pas toujours obligatoire

    new_password: vine.string().trim().minLength(6).optional().requiredIfExists('current_password'), //  ne peut être présent que si current_password est fourni
  })
)

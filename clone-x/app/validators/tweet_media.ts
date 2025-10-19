import vine from '@vinejs/vine'

export const tweetMediaValidator = vine.compile(
  vine
    .object({
      media: vine.file({
        size: '500mb',
        extnames: ['jpg', 'png', 'pdf', 'jpeg', 'gif', 'mp4'],
      }),
    })
    .optional()
)

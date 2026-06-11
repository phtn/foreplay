export async function compressImage(file: File | null, maxSizeKB = 950) {
  if (!file) return null
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        const MAX_DIM = 1600
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.drawImage(img, 0, 0, width, height)

        let quality = 0.8
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size > maxSizeKB * 1024 && quality > 0.2) {
                quality -= 0.1
                tryCompress()
              } else {
                const compressed =
                  blob &&
                  new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  })
                resolve(compressed)
              }
            },
            'image/jpeg',
            quality
          )
        }
        tryCompress()
      }
      img.src = e?.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

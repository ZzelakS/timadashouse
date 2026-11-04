const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string | undefined
const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string | undefined
import { convex } from './convex'
import { api } from '../../convex/_generated/api'

const folder = (import.meta.env.VITE_IMAGEKIT_FOLDER as string | undefined) || '/timadashouse/beauty'

export const isImageKitConfigured = Boolean(publicKey && urlEndpoint && convex)

export interface UploadedImage {
  url: string
  fileId: string
  name: string
}

interface AuthParams {
  token: string
  expire: number
  signature: string
}

/**
 * The private key never reaches the browser. `api/imagekit-auth` signs a short
 * lived token server-side and this posts the file straight to ImageKit with it.
 */
async function getAuthParams(): Promise<AuthParams> {
  if (!convex) throw new Error('Connect the studio backend before uploading')
  const data = await convex.action(api.imagekit.uploadAuth,{})
  if (!data.token || !data.signature || !data.expire) {
    throw new Error('Upload auth returned an unexpected response.')
  }
  return { token: data.token, expire: Number(data.expire), signature: data.signature }
}

export function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedImage> {
  if (!isImageKitConfigured) {
    return Promise.reject(
      new Error('Image uploads have not been set up. Ask the site administrator to connect the image service, or paste an image URL.'),
    )
  }

  return getAuthParams().then(
    (auth) =>
      new Promise<UploadedImage>((resolve, reject) => {
        const body = new FormData()
        body.append('file', file)
        body.append('fileName', file.name)
        body.append('publicKey', publicKey as string)
        body.append('signature', auth.signature)
        body.append('expire', String(auth.expire))
        body.append('token', auth.token)
        body.append('folder', folder)
        body.append('useUniqueFileName', 'true')

        const request = new XMLHttpRequest()
        request.open('POST', 'https://upload.imagekit.io/api/v1/files/upload')

        request.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress?.(Math.round((event.loaded / event.total) * 100))
          }
        }

        request.onload = () => {
          try {
            const data = JSON.parse(request.responseText) as {
              url?: string
              fileId?: string
              name?: string
              message?: string
            }
            if (request.status >= 200 && request.status < 300 && data.url && data.fileId) {
              resolve({ url: data.url, fileId: data.fileId, name: data.name ?? file.name })
            } else {
              reject(new Error(data.message || `ImageKit rejected the upload (${request.status})`))
            }
          } catch {
            reject(new Error('ImageKit returned a response that could not be read.'))
          }
        }

        request.onerror = () => reject(new Error('Network error while uploading to ImageKit.'))
        request.send(body)
      }),
  )
}

/**
 * ImageKit resizes on the fly, so ask for the size actually being displayed.
 * Local files (the bundled placeholders) are returned untouched.
 */
export function imageUrl(src: string, width: number, height?: number): string {
  if (!src || !urlEndpoint || !src.startsWith(urlEndpoint)) return src
  const parts = [`w-${width}`]
  if (height) parts.push(`h-${height}`, 'fo-auto')
  parts.push('q-82')
  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}tr=${parts.join(',')}`
}

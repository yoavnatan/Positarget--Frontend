import { useState, ChangeEvent } from 'react'
import { uploadService } from '../services/upload.service'

export function ImgUploader({ onUploaded }: { onUploaded?: (imgUrl: string) => void }) {
  const [imgData, setImgData] = useState<any>({ imgUrl: null, height: 500, width: 500 })
  const [isUploading, setIsUploading] = useState(false)

  async function uploadImg(ev: ChangeEvent<HTMLInputElement>) {
    setIsUploading(true)
    if (!ev.target.files) return
    const fileArray = Array.from(ev.target.files)
    const { secure_url, height, width } = await uploadService.uploadImg({ target: { files: fileArray } })
    setImgData({ imgUrl: secure_url, width, height })
    setIsUploading(false)
    if (onUploaded) onUploaded(secure_url)
  }

  function getUploadLabel() {
    if (imgData.imgUrl) return 'Upload Another?'
    return isUploading ? 'Uploading....' : 'Upload Image'
  }

  return (
    <div className="upload-preview">
      {imgData.imgUrl && <img src={imgData.imgUrl} style={{ maxWidth: '200px', float: 'right' }} />}
      <label htmlFor="imgUpload" style={{ cursor: 'pointer' }}>{getUploadLabel()}</label>
      <input type="file" onChange={uploadImg} accept="image/*" id="imgUpload" hidden />
    </div>
  )
}
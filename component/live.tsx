import { Button } from "antd"
import { useState, useRef } from "react"
import { io } from "socket.io-client"

const socket = io("http://localhost:3003")
const Live: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [flag, setFlag] = useState(false) // react 没有vue的双向绑定
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaRecord, setMediaRecord] = useState<MediaRecorder | null>(null)
  const open = async () => {
    //getUserMedia 获取摄像头喝麦克风
    // getDisplayMedia 获取电脑屏幕
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    setStream(stream)
    console.log(stream)
    // 专门处理媒体流
    const mediaRecord = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    })
    setMediaRecord(mediaRecord)
    mediaRecord.addEventListener("dataavailable", (e) => {
      console.log(e.data)
      if (e.data.size > 0) {
        socket.emit("video-stream", e.data)
      }
    })
    mediaRecord.start(1000) // 启用这个流，一秒钟捕获一次流
    videoRef.current!.srcObject = stream
    videoRef.current!.play()
    setFlag(true)
  }
  const close = () => {
    videoRef.current!.srcObject = null
    stream?.getTracks().forEach((track) => {
      track.stop()
    })
    mediaRecord?.stop()
    socket.emit("close")
    setFlag(false)
  }
  return (
    <div>
      <video controls className="video" ref={videoRef}></video>
      <div className="btn">
        {!flag ? (
          <Button danger onClick={open}>
            开始直播
          </Button>
        ) : (
          <Button type="primary" onClick={close}>
            结束直播
          </Button>
        )}
      </div>
    </div>
  )
}
export default Live

### 直播课程讲直播

直播，通常指网络直播，是通过互联网实时传输视频和音频内容的一种方式。它允许用户在不同地点观看同样的实时活动或事件。直播技术被广泛应用于各种场景，如娱乐、教育、体育赛事、游戏、社交媒体等。

### 直播的关键特点

1. **实时性**：直播内容是实时传输的，观众可以在事件发生的同时观看。
2. **互动性**：观众可以通过聊天、评论、点赞等方式与主播或其他观众互动。
3. **广泛传播**：通过互联网，直播可以面向全球观众，不受地域限制。
4. **多平台支持**：直播可以在多种设备上观看，如电脑、智能手机、平板电脑、智能电视等

### RTMP 协议

RTMP（Real-Time Messaging Protocol，实时消息传输协议）是一种用于实时数据传输的协议，最初由 Macromedia（现在是 Adobe）开发，用于实现 Flash 媒体服务器与 Flash 客户端之间的音视频传输和数据通信。后来，RTMP 被广泛应用于网络直播、实时通信等领域。

### 主要特点和用途：

1. **实时传输**：RTMP 是一种实时协议，适用于需要低延迟的音视频直播和互动应用场景。
2. **多媒体支持**：RTMP 主要用于传输音频、视频和数据，支持多种编码格式和多路复用（multiplexing）。
3. **流式传输**：RTMP 支持流式传输（streaming），使得音视频可以在数据流传输的同时进行播放，而不需要等待整个文件下载完成。
4. **多种传输方式**：RTMP 提供多种传输方式，包括实时传输（live）、点播（ondemand）和实时消息（messaging）。
5. **互动性**：RTMP 允许客户端与服务器之间进行双向通信，支持实时互动功能，如聊天、投票等。

### 技术架构

https://boardmix.cn/app/share/CAE.CPb08gsgASoQFYrFsIb2_OpKwQiZADa9ijAGQAE/cS3iZs，
点击链接加入 boardmix 中的文件「直播技术」

### 前端

```sh
npm install react react-dom  socket.io-client socket.io antd
```

App.tsx

```tsx
import React from "react"
import { Layout } from "antd"
import "./App.less"
import Live from "./components/live"
const { Header, Content } = Layout
const App: React.FC = () => {
  return (
    <Layout className="layout">
      <Header style={{ display: "flex", alignItems: "center" }}></Header>
      <Content>
        <div className="content">
          <Live></Live>
        </div>
      </Content>
    </Layout>
  )
}

export default App
```

live.tsx

```tsx
import { Card, Button } from "antd"
import "./live.less"
import { useState, useRef } from "react"
import { io } from "socket.io-client"
const socket = io("http://localhost:3000")
const Live = () => {
  const video = useRef<HTMLVideoElement>(null)
  const [onOff, setOnOff] = useState(true)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [Record, setRecord] = useState<MediaRecorder | null>(null)
  const play = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    const mediaRecord = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9",
    })
    mediaRecord.addEventListener("dataavailable", (e) => {
      if (e.data.size > 0) {
        socket.emit("video-stream", e.data)
      }
    })
    mediaRecord.start(1000)
    setStream(stream)
    setRecord(mediaRecord)
    video!.current!.srcObject = stream
    video!.current!.play()
    setOnOff(false)
  }
  const close = () => {
    console.log("结束直播")
    video!.current!.srcObject = null
    video!.current!.pause()
    stream?.getTracks().forEach((track) => track.stop())
    Record?.stop()
    setOnOff(true)
    socket.emit("close")
  }
  return (
    <Card>
      <video ref={video} className="video" controls src=""></video>
      <div className="btn-group">
        {onOff ? (
          <Button onClick={() => play()} danger>
            开始直播
          </Button>
        ) : (
          <Button onClick={() => close()} type="primary">
            结束直播
          </Button>
        )}
      </div>
    </Card>
  )
}
export default Live
```

vite-env.d.ts

```ts
/// <reference types="vite/client" />
```

vite.config.ts

```ts
import { defineConfig } from "vite"
import ReactSwc from "@vitejs/plugin-react-swc"

export default defineConfig({
  plugins: [ReactSwc()],
})
```

tsconfig.json

```json
"target": "ESNext",
"lib": ["ES2020", "DOM", "DOM.Iterable"],
"jsx": "react-jsx",
```

### Node

```ts
import http from "http"
import { Server } from "socket.io"
import { spawn } from "child_process"
const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: "*",
  },
})
// const
let ffmpeg = null
io.on("connection", (socket) => {
  ffmpeg = spawn("ffmpeg", [
    "-i",
    "pipe:0", // 输入来自标准输入
    "-c:v",
    "libx264", // 使用 libx264 视频编解码器
    "-preset",
    "veryfast", // 使用 veryfast 预设，适合实时编码
    "-tune",
    "zerolatency", // 调优为零延迟，适合实时传输
    "-c:a",
    "aac", // 使用 aac 音频编解码器
    "-b:a",
    "128k", // 音频比特率为 128k
    "-f",
    "flv", // 输出格式为 FLV
    "rtmp://8.140.249.87:1935/live/stream", // 输出到 RTMP 服务器的流地址
  ])
  socket.on("video-stream", (data) => {
    if (ffmpeg) {
      ffmpeg.stdin.write(data)
    }
  })
  socket.on("disconnect", () => {
    if (ffmpeg) {
      ffmpeg.stdin.end()
      ffmpeg = null
    }
    console.log("断开连接")
  })
  socket.on("close", () => {
    if (ffmpeg) {
      ffmpeg.stdin.end()
      ffmpeg = null
    }
    console.log("直播结束")
  })
})

server.listen(3000, () => {
  console.log("server is running on port 3000")
})
```

### 服务器 Nginx

```sh
sudo yum install -y gcc pcre pcre-devel zlib zlib-devel openssl openssl-devel

yum install epel-release -y
yum install build-essential -y
```

```sh
cd ~
wget http://nginx.org/download/nginx-1.18.0.tar.gz
tar -zxvf nginx-1.18.0.tar.gz
cd nginx-1.18.0

# 下载 nginx-rtmp-module
git clone https://github.com/arut/nginx-rtmp-module.git

# 编译安装
./configure --add-module=./nginx-rtmp-module
make
sudo make install
```

使用 `make` 命令会读取 `Makefile` 文件，并根据其中定义的规则和指令，自动执行编译过程，生成可执行文件或者库文件。

`sudo make install` 命令用于安装编译完成的软件或者工具。在编译完成后，通过这个命令可以将生成的可执行文件、库文件等复制到系统的标准位置，使得程序可以在任何地方被调用和使用。

测试端口 `netstat -tunlp | grep 1935` `netstat -tunlp | grep 80`

测试是否安装插件 `nginx -V 2>&1 | grep --color -o 'http\|rtmp'`

`/usr/local/nginx/conf/nginx.conf` 修改配置文件

```nginx
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on; #开启直播功能
            record off; #关闭录制功能

            # 添加 HLS 支持
            hls on;
            hls_path /usr/local/nginx/html/hls;
            hls_fragment 3; # 每个 HLS 分段 3 秒
            hls_playlist_length 60; # 播放列表长度 60 秒
          }
      }
}

#拉流
location /hls {
       types {
            application/vnd.apple.mpegurl m3u8;
             video/mp2t ts;
       }
      alias /usr/local/nginx/html/hls;
      add_header Cache-Control no-cache;
      add_header Access-Control-Allow-Origin *;
      add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
}
```

HLS（HTTP Live Streaming）是一种基于 HTTP 协议的流媒体传输协议，由 Apple 公司开发。它是一种自适应比特率的流媒体技术，广泛应用于视频直播和点播服务。HLS 将视频流切分成小的片段（通常为几秒钟），并通过标准的 HTTP 协议传输，使得视频流可以在不同网络条件下自适应调整比特率，保证流畅的播放体验。

**视频分段**：

- 视频源被编码为多个不同比特率的版本。
- 每个版本被切分成小片段（segments），每个片段通常为几秒钟时长（例如 2-10 秒）。
- 这些片段以 `.ts`（MPEG-TS）文件的形式存储在服务器上。

启动 `sudo /usr/local/nginx/sbin/nginx`

### 播放端

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <link href="https://vjs.zencdn.net/7.11.4/video-js.css" rel="stylesheet" />
  </head>

  <body>
    <video
      id="my_video"
      class="video-js vjs-default-skin"
      controls
      preload="auto"
      width="640"
      height="360"
    >
      <source
        src="http://8.140.249.87/hls/stream.m3u8"
        type="application/x-mpegURL"
      />
    </video>
    <script src="https://vjs.zencdn.net/7.11.4/video.min.js"></script>
    <script>
      var player = videojs("my_video")
    </script>
  </body>
</html>
```

## （对应 ip 不能访问问题）例子 xxx:1935

1. 在阿里云 位置 网络与安全-安全组 添加对应的端口号
2. cmd 在防火墙添加对应端口的访问权限 `firewall-cmd --zone=public --add-port=1935/tcp --permanent`
3. cmd 重启防火墙 `firewall-cmd --reload`

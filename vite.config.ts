// react 默认是babel 编译的
// swc 速度是babel 的七倍 rust 语言编写的 

import { defineConfig } from "vite";
import React from "@vitejs/plugin-react-swc";
export default defineConfig({
    plugins:[React()],
})
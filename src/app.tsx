import React from "react"
import { Breadcrumb, Layout, Menu, theme } from "antd"
import Live from "../component/live"
const { Header, Content, Footer } = Layout

const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Layout>
      <Header style={{ display: "flex", alignItems: "center" }}></Header>
      <Content style={{ padding: "0 48px" }}>
        <div>
          <Live />
        </div>
      </Content>
    </Layout>
  )
}

export default App

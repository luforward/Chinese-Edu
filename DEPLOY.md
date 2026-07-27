# 部署 AI 英文语音版（Vercel）

这一步会将网页和安全的语音接口一起部署。API Key 只保存在 Vercel，不会出现在网页或 GitHub 中。

## 1. 上传到 GitHub

1. 在 GitHub 创建一个 **Private** 仓库，例如 `assimil-english-v1`。
2. 上传本文件夹的全部内容。请确认 `.gitignore` 也一并上传。
3. 不要创建或上传任何包含 API Key 的文件。

## 2. 在 Vercel 部署

1. 登录 https://vercel.com/ ，选择 **Add New → Project**。
2. 选择并导入刚才的 GitHub 仓库。
3. 保持默认设置，点击 **Deploy**。

## 3. 保存 OpenAI API Key

1. 打开 Vercel 项目，进入 **Settings → Environment Variables**。
2. 新建变量：

   - Name: `OPENAI_API_KEY`
   - Value: 你在 OpenAI Platform 创建的 API Key
   - Environments: 勾选 `Production` 和 `Preview`

3. 保存后，前往 **Deployments**，点击最新部署右侧的菜单并选择 **Redeploy**。

## 4. 测试

打开 Vercel 给出的 `https://...vercel.app` 网址，开始课程后按播放按钮。第一次播放一句英文会请求 AI 生成 MP3；同一句在该次打开网页期间会直接重用音频。

## 安全提醒

- `OPENAI_API_KEY` 只能填在 Vercel 的环境变量页面，绝不能放在 `app.js`、`api/tts.js`、GitHub 或聊天消息中。
- 这是自用版。若要公开分享，请先增加用户登录和调用次数限制，否则访客可能消耗你的 API 额度。
- 若点击播放失败，先确认：网址是 `https://` 的 Vercel 地址、环境变量名完全正确，并且保存变量后已经 Redeploy。

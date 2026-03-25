# Travel Gallery

腾讯云服务器部署文档（Ubuntu 22.04，Docker + Nginx + HTTPS + PostgreSQL）。

## 1. 本地开发

1. 安装依赖

   npm ci

2. 准备环境变量

   cp .env.example .env

3. 启动开发环境

   npm run dev

## 2. 生产部署准备

1. 服务器安装 Docker、Nginx、Certbot。
2. 放通安全组端口 22/80/443。
3. 域名 A 记录指向服务器公网 IP。
4. 准备 COS 参数：COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET、COS_REGION。

## 3. 配置生产环境变量

1. 在项目根目录创建生产环境文件：

   cp .env.production.example .env.production

2. 必填变量：
   - NEXTAUTH_URL=https://你的域名
   - NEXTAUTH_SECRET=32位以上随机字符串
   - POSTGRES_PASSWORD=强密码
   - DATABASE_URL=postgresql://travel:强密码@postgres:5432/travel?schema=public
   - COS_SECRET_ID/COS_SECRET_KEY/COS_BUCKET/COS_REGION

3. 可选一次性管理员初始化：
   - ADMIN_EMAIL=管理员邮箱
   - ADMIN_PASSWORD=管理员密码（至少 8 位）
   - ADMIN_NAME=管理员名称

## 4. 一键部署

在项目根目录执行：

1. 首次或更新部署

   bash docker/deploy.sh

2. 健康检查

   bash docker/check.sh

## 5. Nginx 与 HTTPS

1. 参考示例配置：
   - docker/nginx-travel.conf.example

2. 将示例中的域名替换为真实域名后，放到服务器：

   /etc/nginx/sites-available/travel

3. 启用配置并校验：

   sudo ln -s /etc/nginx/sites-available/travel /etc/nginx/sites-enabled/travel
   sudo nginx -t
   sudo systemctl reload nginx

4. 使用 Certbot 签发证书。

## 6. 数据库迁移说明

本项目当前使用 PostgreSQL 作为 Prisma 数据源，容器启动后会执行：

- prisma migrate deploy

请确保生产环境 DATABASE_URL 指向 postgres 服务。

## 7. 常用命令

- 查看服务状态

  docker compose --env-file .env.production -f docker-compose.prod.yml ps

- 查看应用日志

  docker compose --env-file .env.production -f docker-compose.prod.yml logs app --tail=200

- 手动执行迁移

  docker compose --env-file .env.production -f docker-compose.prod.yml exec -T app npm run db:migrate:deploy

- 手动初始化管理员

  docker compose --env-file .env.production -f docker-compose.prod.yml exec -T app npm run db:seed:admin

## 8. GitHub Actions 自动发布

已提供工作流：

- .github/workflows/deploy-tencent-cloud.yml

触发方式：

1. push 到 main 自动发布。
2. 在 Actions 页面手动触发 workflow_dispatch，可指定分支。

仓库 Secrets 需要配置：

1. TENCENT_HOST：服务器公网 IP 或域名。
2. TENCENT_USER：SSH 用户名（如 ubuntu）。
3. TENCENT_SSH_KEY：私钥内容（推荐）。
4. TENCENT_SSH_PASSWORD：SSH 登录密码（如果不用私钥就填这个）。
5. TENCENT_PORT：SSH 端口（默认 22，可留空）。
6. TENCENT_DEPLOY_PATH：服务器上的项目路径（例如 /home/ubuntu/travel）。

认证方式说明：

1. 支持私钥和账号密码两种方式。
2. 至少提供一种：TENCENT_SSH_KEY 或 TENCENT_SSH_PASSWORD。
3. 若两者都提供，优先走私钥认证。

服务器前置要求：

1. 目标路径已存在且是 Git 仓库，当前分支包含 docker/deploy.sh。
2. 服务器该路径下已准备 .env.production（不要放到仓库）。
3. 服务器已安装 Docker 与 Docker Compose 插件。
4. 如果使用账号密码登录，服务器 SSH 配置需允许 PasswordAuthentication。

发布流程会执行：

1. git pull --ff-only 同步目标分支代码。
2. bash docker/deploy.sh 构建并重启容器、执行 Prisma migrate deploy。
3. bash docker/check.sh 输出健康状态。

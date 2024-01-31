FROM node:18.19.0
# FROM online-registry.cn-hongkong.cr.aliyuncs.com/okbase/node:18.12.1-okg1
WORKDIR /app
COPY .  /app
RUN yarn install
RUN npm set registry https://registry.npm.taobao.org/
# RUN npm config set registry https://registry-npm.okg.com/
# RUN cd /app/packages/server-render
# COPY dist ./
# Specify the command to run when the container starts
CMD [ "yarn", "start" ]
EXPOSE 7001

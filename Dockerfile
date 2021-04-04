FROM node:14.16-alpine as dev

ENV PATH="/application/node_modules/.bin:${PATH}"
RUN apk add bash sudo
RUN echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node && chmod 0440 /etc/sudoers.d/node
ENV NODE_ENV='development'
CMD cd "/application" && \
    npm install && \
    npm run watch
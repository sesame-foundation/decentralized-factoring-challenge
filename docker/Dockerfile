FROM rust:latest
RUN curl -fsSL https://deb.nodesource.com/setup_17.x | bash -
RUN apt install -y nodejs
RUN npm install --global yarn
RUN sh -c "$(curl -sSfL https://release.solana.com/v1.9.1/install)"
RUN apt-get install -y libudev-dev
RUN apt-get install -y libclang-dev
RUN echo PATH="/root/.local/share/solana/install/active_release/bin:$PATH" > ~/.bash_rc
ENV NODE_OPTIONS=--openssl-legacy-provider
EXPOSE 3000
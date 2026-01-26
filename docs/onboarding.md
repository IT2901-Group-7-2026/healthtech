# Onboarding

- [Onboarding](#onboarding)
  - [Tools](#tools)
    - [Package Manager](#package-manager)
      - [Mac: Homebrew](#mac-homebrew)
      - [Windows: UniGetUi](#windows-unigetui)
      - [Linux: Distro default](#linux-distro-default)
      - [Why install a package manager?](#why-install-a-package-manager)
    - [Node Version Manager](#node-version-manager)
      - [Mac and Linux: nvm](#mac-and-linux-nvm)
      - [Windows: fnm](#windows-fnm)
      - [Why do I need a Node Version Manager](#why-do-i-need-a-node-version-manager)
    - [Node](#node)
      - [nvm](#nvm)
      - [fnm](#fnm)
      - [Why do I need Node?](#why-do-i-need-node)
      - [Why Node LTS version?](#why-node-lts-version)
    - [pnpm](#pnpm)
      - [Why pnpm?](#why-pnpm)

## Tools

Optional: [Package Manager](#package-manager) based on your OS

Optional: [Node Version Manager](#node-version-manager)

Required: [Node](#node) LTS(Long-Time Support) Version (JS runtime)

Required: [pnpm](#pnpm) (JS package manager)

### Package Manager

#### Mac: Homebrew

Install [Homebrew (Homepage)](https://brew.sh/)

#### Windows: UniGetUi

Install [UniGetUi (Homepage)](https://www.marticliment.com/unigetui/)

#### Linux: Distro default

> Use the package manager bundled with your distro

You're a Linux user.
You already have an opinion on this.

#### Why install a package manager?

A package manager gives you a central location for
adding, updating, upgrading and deleting packages on your computer.

### Node Version Manager

#### Mac and Linux: nvm

Install [nvm (GitHub)](https://github.com/nvm-sh/nvm) with your chosen package manager.

#### Windows: fnm

Install [fnm (GitHub)](https://github.com/Schniz/fnm) with UniGetUi

#### Why do I need a Node Version Manager

A Node Version Manager lets you install multiple versions of Node
and easily switch between them.

### Node

Install Node LTS version

#### nvm

```sh
nvm install --lts
```

#### fnm

```sh
fnm install --lts
```

#### Why do I need Node?

Node is a runtime for running JS programs kinda like how the JVM runs Java.

This is used to run JS on the server,
which is an absolute requirement for backend,
and an additional requirement for frontend where some pages might need server rendering.

#### Why Node LTS version?

We try to keep the Node version at the current LTS for a balance between stability and new features.

### pnpm

Enable corepack

```sh
corepack enable
```

Install pnpm globally

```sh
corepack install -g pnpm
```

To update your pnpm version run:

```sh
corepack up
```

#### Why pnpm?

We use pnpm as we find it better to use than npm which comes with Node.

npm is built so every dependency is downloaded locally per project.
This takes a lot of disk space when you have multiple projects on your PC.

pnpm works around this by downloading dependencies globally.
This lets pnpm reuse the same dependencies with the same versions of different projects.

It is also easier to develop together when we all use the same .lock file.

If you find it annoying to have multiple JS package managers I recommend checking out [Antfu's ni](https://github.com/antfu-collective/ni) which automatically runs commands with the right package managers based on what lock file there is.

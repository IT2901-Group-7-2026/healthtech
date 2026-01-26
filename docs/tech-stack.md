# Tech Stack

## Overview

| Use case | Official docs | Our reasoning |
| --- | --- | --- |
| Programming language: | [TypeScript](https://www.typescriptlang.org/) | [the language of the web](#typescript-language-of-the-web) |
| Component framework: | [React](https://react.dev/) | [helps us re-use code](#react-helps-us-re-use-code) |
| Build tool: | [Vite](https://vite.dev/) | [makes build configuration a problem of the past](#vite-makes-build-configuration-a-problem-of-the-past) |
| Router/Meta-framework: | [React Router](https://reactrouter.com/dev/guides) | [expands our app over multiple pages](#react-router-expands-our-app-over-multiple-pages) |
| Style system: | [Tailwind](https://tailwindcss.com/) | [simplifies styling and makes everything pretty](#tailwind-simplifies-styling-and-makes-everything-pretty) |
| Linter, Formatter: | [Biome](https://biomejs.dev/) | [eliminates bugs pre-emptively and keeps code consistent](#biome-eliminates-bugs-preemptively-and-keeps-code-consistent) |
| Component collection: | [Shadcn/ui](https://ui.shadcn.com/) | [starts us off on the right foot](#shadcnui-starts-us-off-on-the-right-foot) |
| Headless components: | [Radix UI](https://www.radix-ui.com/) | [provides functional and accessible primitives](#radix-primitives-provides-functional-and-accessible-primitives) |
| Package manager: | [pnpm](https://pnpm.io/) | [reduces the black hole that is node_modules](#pnpm-reduces-the-black-hole-that-is-node_modules) |

## Reasoning

### TypeScript, language of the web

TypeScript reduces runtime errors to red squiggles in your editor.\
TypeScript helps your text editor or IDE autocomplete your code with intellisense.

JavaScript is the most used language on the web,
and TypeScript (for application developers) is effectively JavaScript but better (with types).

### React helps us re-use code

React was chosen as our component framework as it is the de facto standard for component driven web development

### Vite makes build configuration a problem of the past

During the 2020s Vite became the de facto standard build tool
for building applications with React.\
It solves the problem of building applications with React.

### React Router expands our app over multiple pages

React Router was chosen as a simple way to add routing to our Single-Page Application

### Tailwind simplifies styling and makes everything pretty

Tailwind was chosen as our style system as it is currently
the de facto standard for styling modern web applications.
It is incredibly efficient, only bundling the classes used within the application.

### Biome eliminates bugs preemptively and keeps code consistent

Biome was chosen over Prettier and ESlint because configuring ESlint
takes an ungodly amount of time.\
ESlint might have extensible configuration,
but Biome ships with great defaults and incredible performance.\
Using 1 tool for 2 problems also reduces the amount of packages we depend on, which reduces the surface area for attack and accidental bugs.

### shadcn/ui starts us off on the right foot

shadcn/ui is not a dependency,
but a collection of copy-pastable components,
providing a great starting point for building UIs.\
shadcn/ui uses tools we already have decide to use so it fits nicely
within our "stack".

### Radix Primitives provides functional and accessible primitives

Radix Primitives is a collection of headless (unstyled) components
so commonly used within web apps they have standards for accessibility.\
Radix Primitives adhere to the
[WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/) accessibility practices.\
Radix Primitives is used in the component collection shadcn/ui provides.\
In house UI components should use Radix Primitives when possible.

### pnpm reduces the black hole that is node_modules

pnpm install and manages packages globally while reducing unnecessary
merge conflicts and providing a readable lock file when they eventually do happen.
pnpm is essentially npm but better at the cost of one character

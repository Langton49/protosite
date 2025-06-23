# Protosite

Protosite is a Canva app that allows users to turn their website designs into live, deployable source code. Using generative AI, Protosite creates easy to understand, well-documented, and beginner-friendly code that even the most novice programmer can work with. Protosite makes the workflow from concept to live app easier and quicker making it perfect for anyone who may want to deploy a website quickly.

## Requirements

- Node.js `v18` or `v20.10.0`
- npm `v9` or `v10`

## Setup
- To begin, clone this repository onto your local system and navigate to the project's root directory.
- Open a command line terminal in the root directory and run the following command to install dependencies:

```bash
npm install
```
- Once installed, run the following commands to start the development server and the backend respectively:
```bash
npm run start
npm run start:server
```
- After receiving confirmation that both servers are running on localhost, follow the link below to preview the App with a predefined website design:

[Protosite Preview](https://www.canva.com/login/?redirect=%2Fdesign%3Fcreate%26template%3DEAGRieql5Ds%26ui%3DeyJFIjp7IkE_IjoiTiIsIlMiOiJBQUdxOE5lZ2VBayIsIlQiOjF9fQ)

- To try the app with your own template, copy the URL below and replace <TEMPLATE-ID> with the template's id:

```bash
https://www.canva.com/login/?redirect=%2Fdesign%3Fcreate%26template%3D<TEMPLATE-ID>%26ui%3D<APP-UI>
```
- To find the id, follow the directions detailed at the link below:
[Generating a Deep Link](https://www.canva.dev/docs/apps/deep-linking/#generate-a-deep-link)


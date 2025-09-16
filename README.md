# Protosite

Protosite is a Canva app that allows users to turn their website designs into live, deployable source code. Using generative AI, Protosite creates easy to understand, well-documented, and beginner-friendly code that even the most novice programmer can work with. Protosite makes the workflow from concept to live app easier and quicker making it perfect for anyone who may want to deploy a website quickly.

## Requirements

- Node.js `v18` or `v20.10.0`
- npm `v9` or `v10`

## Setup
1. To begin, clone this repository onto your local system and navigate to the project's root directory.
2. Open a command line terminal in the root directory and run the following command to install dependencies:

```bash
npm install
```
3. Once installed, run the following commands to start the development server and the backend respectively:
```bash
npm run start
npm run start:server
```
4. After receiving confirmation that both servers are running on localhost, follow the link below to preview the App with a predefined website template (**Only available for users on paid plans**) : <br>

[Protosite Preview](https://www.canva.com/login/?redirect=%2Fdesign%3Fcreate%26template%3DEAGRieql5Ds%26ui%3DeyJFIjp7IkE_IjoiTiIsIlMiOiJBQUdxOE5lZ2VBayIsIlQiOjF9fQ)

5. To try the app with your own template, copy the URL below and replace <TEMPLATE-ID> with the template's id:

```bash
https://www.canva.com/login/?redirect=%2Fdesign%3Fcreate%26template%3D<TEMPLATE-ID>%26ui%3DeyJFIjp7IkE_IjoiTiIsIlMiOiJBQUdxOE5lZ2VBayIsIlQiOjF9fQ
```
6. To find the id, follow the directions detailed at the link below:<br>

  [Generating a Deep Link](https://www.canva.dev/docs/apps/deep-linking/#generate-a-deep-link)

**Considerations:** To run the app locally with all its functionality, the following extra environment variables need to be set in an .env file along with the CANVA variable as defined in .env.template:

```bash
OPENAI_API_KEY= 
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## Using The App

1. To generate React source code from your website design click the 'Generate Source Code' button. You'll be prompted to export the design as an image. Click export to begin content generation.
2. Allow up to 3 minutes for the AI agent to finish generating the source code. Once done, two buttons will appear: 'Open Preview' and 'Export To GitHub'.
3. Click 'Open Preview' to view a running preview of the generated site. **NB:** This is not a deployment, simply a container through which you can view what the website could look like.
4. If you wish to export the source code to a repo you must first connect your GitHub account by clicking the 'Connect To GitHub' button.
5. Once the app confirms you've connected your account, you should be able to export the generated source code to a new repo in your GitHub profile by clicking the 'Export To GitHub' button.

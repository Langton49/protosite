import { Button, Rows, Text } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { FormattedMessage, useIntl } from "react-intl";
import { requestExport } from "@canva/design";
import * as styles from "styles/components.css";
import { useState } from "react";

declare const BACKEND_HOST: string;
const backendUrl = BACKEND_HOST;

interface GitHubAuthResponse {
  authUrl: string;
  state: string;
}

interface GitHubRepoResponse {
  repoUrl: string;
  success: boolean;
  message: string;
}

export const App = () => {
  const [preview, setPreview] = useState<boolean>(false);
  const [isGitHubConnected, setIsGitHubConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [githubToken, setGitHubToken] = useState<string | null>(null);

  const onClick = async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const image = await requestExport({
        acceptedFileTypes: ["jpg", "png"],
      });
      const fileUrl = image.exportBlobs[0].url;
      await uploadFileToBackend(fileUrl);
      setPreview(true);
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error("Error generating source code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const openExternalEditor = () => {
    if (!preview) return;
    requestOpenExternalUrl({ url: "https://localhost:5173" });
  };

  const connectToGitHub = async (): Promise<void> => {
    if (isConnecting) return;

    setIsConnecting(true);

    try {
      // Request GitHub OAuth URL from backend
      const response = await fetch(`${backendUrl}/api/github/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initiate GitHub authentication");
      }

      const data: GitHubAuthResponse = await response.json();

      // Open GitHub OAuth in external browser
      await requestOpenExternalUrl({ url: data.authUrl });

      // Start polling for authentication completion
      await pollForGitHubAuth(data.state);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error connecting to GitHub:", error);
      throw new Error("Error connecting to GitHub profile. Try again shortly.");
    } finally {
      setIsConnecting(false);
    }
  };

  const pollForGitHubAuth = async (state: string): Promise<void> => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const checkAuth = async (): Promise<boolean> => {
      try {
        const response = await fetch(`${backendUrl}/api/github/auth/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ state }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsGitHubConnected(true);
            setGitHubToken(data.token);
            return true;
          }
        }
        return false;
      } catch (error) {
        //eslint-disable-next-line no-console
        console.error("Error checking GitHub auth status:", error);
        return false;
      }
    };

    const poll = async (): Promise<void> => {
      while (attempts < maxAttempts) {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) break;

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10s
      }

      setIsConnecting(false); // ✅ Moved here
    };

    await poll();
  };

  const exportToGitHub = async (): Promise<void> => {
    if (!isGitHubConnected || !githubToken || isExporting) return;

    setIsExporting(true);

    try {
      // Get the current project structure
      const projectResponse = await fetch(`${backendUrl}/api/project`);
      if (!projectResponse.ok) {
        throw new Error("Failed to get project data");
      }
      const projectData = await projectResponse.json();

      // Create GitHub repository and push code
      const response = await fetch(`${backendUrl}/api/github/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: githubToken,
          projectData: projectData.app,
          repoName: `canva-design-${Date.now()}`, // Generate unique repo name
          description: "Generated from Canva design using Protosite",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export to GitHub");
      }

      const data: GitHubRepoResponse = await response.json();

      if (data.success) {
        // Open the newly created repository
        await requestOpenExternalUrl({ url: data.repoUrl });
      } else {
        throw new Error(data.message || "Export failed");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error exporting to GitHub:", error);
      throw new Error("Failed to export to GitHub. Try again shortly.");
    } finally {
      setIsExporting(false);
    }
  };

  const uploadFileToBackend = async (fileUrl: string): Promise<void> => {
    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: fileUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      return data.projectStructure;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error uploading file:", error);
      return Promise.reject(error);
    }
  };

  const intl = useIntl();

  return (
    <div className={styles.scrollContainer}>
      <h1>
        <FormattedMessage
          defaultMessage="Welcome to Protosite!"
          description="Text welcoming user."
        />
      </h1>
      <Rows spacing="2u">
        <Text>
          <FormattedMessage
            defaultMessage="Generate the code for your website design with the button below. Then click 'Open Preview' to see the generated files and a preview of your app. Allow up to 5 minutes while content is being generated"
            description="Text to explain the export functionality in the app."
          />
        </Text>

        <Button
          variant="primary"
          onClick={onClick}
          stretch
          loading={isGenerating}
          disabled={isGenerating}
        >
          {intl.formatMessage({
            defaultMessage: "Generate Source Code",
            description: "Button text to generate react code for Canva design.",
          })}
        </Button>

        <Button
          variant="secondary"
          onClick={connectToGitHub}
          stretch
          loading={isConnecting}
          disabled={isGitHubConnected}
        >
          {isGitHubConnected
            ? intl.formatMessage({
                defaultMessage: "GitHub Connected ✓",
                description: "Button text when GitHub is connected.",
              })
            : intl.formatMessage({
                defaultMessage: "Connect To GitHub",
                description: "Button text to connect to the user's GitHub.",
              })}
        </Button>

        {preview && (
          <Rows spacing="1u">
            <Button variant="secondary" onClick={openExternalEditor} stretch>
              {intl.formatMessage({
                defaultMessage: "Open Preview",
                description:
                  "Button text to open the preview of the exported design.",
              })}
            </Button>

            <Button
              variant="secondary"
              onClick={exportToGitHub}
              stretch
              loading={isExporting}
              disabled={!isGitHubConnected}
            >
              {intl.formatMessage({
                defaultMessage: "Export To GitHub",
                description:
                  "Button text to export the source code to a GitHub repo.",
              })}
            </Button>
          </Rows>
        )}
      </Rows>
    </div>
  );
};

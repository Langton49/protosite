import { Button, Rows, Text } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { requestExport } from "@canva/design";
import { useState } from "react";

declare const BACKEND_HOST: string;
const backendUrl = BACKEND_HOST;

export const App = () => {
  const [previewReady, setPreviewReady] = useState<boolean>(false); // Hook to display 'Go To Protosite Editor' button when preview is ready.

  const uploadFileToBackend = async (fileUrl: string): Promise<void> => {
    try {
      const response = await fetch(`${backendUrl}/protosite/upload`, {
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

  const openExternalEditor = () => {
    if (!previewReady) return;
    requestOpenExternalUrl({ url: "https://localhost:5173" });
  };

  const onClick = async (): Promise<void> => {
    const image = await requestExport({
      acceptedFileTypes: ["jpg", "png"],
    });
    const fileUrl = image.exportBlobs[0].url;
    await uploadFileToBackend(fileUrl);
    setPreviewReady(true);
  };

  const intl = useIntl();

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <h1 id="mainHeading">
          <FormattedMessage
            defaultMessage="Welcome to Protosite!"
            description="Main heading for the app"
          />
        </h1>
        <Text>
          <FormattedMessage
            defaultMessage="Convert your Canva web designs into clean, ready-to-use Vite source code."
            description="Tagline describing what Protosite does"
          />
        </Text>
        <Button variant="primary" onClick={onClick} stretch>
          {intl.formatMessage({
            defaultMessage: "Generate Vite Code",
            description:
              "Primary button that triggers the conversion of a Canva design into Vite-compatible source code.",
          })}
        </Button>
        {previewReady && (
          <Rows spacing="1u">
            <Button variant="secondary" onClick={openExternalEditor} stretch>
              {intl.formatMessage({
                defaultMessage: "Go To Protosite Editor",
                description:
                  "Secondary button that opens the Protosite Editor to preview and edit the exported Vite design.",
              })}
            </Button>
          </Rows>
        )}
      </Rows>
    </div>
  );
};

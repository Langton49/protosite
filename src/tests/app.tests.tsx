/* eslint-disable formatjs/no-literal-string-in-jsx */
import React from "react";
import type { RenderResult } from "@testing-library/react";
import { fireEvent, render } from "@testing-library/react";
import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { useAddElement } from "utils/use_add_element";
import { App, DOCS_URL } from "../app";

function renderInTestProvider(node: React.ReactNode): RenderResult {
  return render(
    // In a test environment, you should wrap your apps in `TestAppI18nProvider` and `TestAppUiProvider`, rather than `AppI18nProvider` and `AppUiProvider`
    <TestAppI18nProvider>
      <TestAppUiProvider>{node}</TestAppUiProvider>,
    </TestAppI18nProvider>,
  );
}

jest.mock("utils/use_add_element");

// This test demonstrates how to test code that uses functions from the Canva Apps SDK
// For more information on testing with the Canva Apps SDK, see https://www.canva.dev/docs/apps/testing/
describe("Hello World Tests", () => {
  // Mocking the useAddElement hook
  const mockAddElement = jest.fn();
  const mockAddUseElement = jest.mocked(useAddElement);
  const mockRequestOpenExternalUrl = jest.mocked(requestOpenExternalUrl);

  beforeEach(() => {
    jest.resetAllMocks();
    mockAddUseElement.mockReturnValue(mockAddElement);
    mockRequestOpenExternalUrl.mockResolvedValue({ status: "completed" });
  });

  // this test uses a mock in place of the useAddElement hook
  it("should add a text element when the button is clicked", () => {
    // assert that the mocks are in the expected clean state
    expect(mockAddUseElement).not.toHaveBeenCalled();
    expect(mockAddElement).not.toHaveBeenCalled();

    const result = renderInTestProvider(<App />);

    // the hook should have been called in the render process but not the callback
    expect(mockAddUseElement).toHaveBeenCalled();
    expect(mockAddElement).not.toHaveBeenCalled();

    // get a reference to the do something cool button element
    const doSomethingCoolBtn = result.getByRole("button", {
      name: "Do something cool",
    });

    // programmatically simulate clicking the button
    fireEvent.click(doSomethingCoolBtn);

    // we expect that addElement has been called by the button's click handler
    expect(mockAddElement).toHaveBeenCalled();
  });

  // this test uses a mock in place of the @canva/platform requestOpenExternalUrl function
  it("should call `requestOpenExternalUrl` when the button is clicked", () => {
    expect(mockRequestOpenExternalUrl).not.toHaveBeenCalled();

    const result = renderInTestProvider(<App />);

    // get a reference to the Apps SDK button by name
    const sdkButton = result.getByRole("button", {
      name: "Open Canva Apps SDK docs",
    });

    expect(mockRequestOpenExternalUrl).not.toHaveBeenCalled();
    fireEvent.click(sdkButton);
    expect(mockRequestOpenExternalUrl).toHaveBeenCalled();

    // assert that the requestOpenExternalUrl function was called with the expected arguments
    expect(mockRequestOpenExternalUrl.mock.calls[0][0]).toEqual({
      url: DOCS_URL,
    });
  });

  // this test demonstrates the use of a snapshot test
  it("should have a consistent snapshot", () => {
    const result = renderInTestProvider(<App />);
    expect(result.container).toMatchSnapshot();
  });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Invite from "./Invite";
import axios from "axios";

import "@testing-library/jest-dom";

// Mock axios
// This will allow us to mock API calls made by the Invite component
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Invite Component", () => {
  const leagueId = "123456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders invite button initially", () => {
    render(<Invite leagueId={leagueId} />);
    expect(screen.getByText("Invite")).toBeInTheDocument();
  });

  it("shows search input when invite button is clicked", () => {
    render(<Invite leagueId={leagueId} />);
    fireEvent.click(screen.getByText("Invite"));
    expect(
      screen.getByPlaceholderText("Search by username")
    ).toBeInTheDocument();
  });

  it("searches for users after typing", async () => {
    const usersMock = [{ _id: "1", username: "testuser" }];
    mockedAxios.get.mockResolvedValueOnce({ data: { users: usersMock } });

    render(<Invite leagueId={leagueId} />);
    fireEvent.click(screen.getByText("Invite"));

    const input = screen.getByPlaceholderText("Search by username");
    fireEvent.change(input, { target: { value: "test" } });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/api/search-users?query=test"
      );
    });

    expect(await screen.findByText("testuser")).toBeInTheDocument();
    expect(screen.getAllByText("Invite")[1]).toBeInTheDocument();
  });

  it("invites user when invite button is clicked", async () => {
    const usersMock = [{ _id: "1", username: "testuser" }];
    mockedAxios.get.mockResolvedValueOnce({ data: { users: usersMock } });
    mockedAxios.post.mockResolvedValueOnce({});

    render(<Invite leagueId={leagueId} />);
    fireEvent.click(screen.getByText("Invite"));

    const input = screen.getByPlaceholderText("Search by username");
    fireEvent.change(input, { target: { value: "test" } });

    // Wait for user to appear
    await screen.findByText("testuser");

    const userInviteButton = screen.getByRole("button", {
      name: "Invite testuser",
    });

    expect(userInviteButton).toBeInTheDocument();
    fireEvent.click(userInviteButton);

    // Check if the invite API was called with correct parameters
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `/api/league/${leagueId}/invite`,
        {
          username: "testuser",
          leagueId,
        }
      );
    });
  });
});

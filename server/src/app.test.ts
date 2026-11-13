import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "./app.js";

const testEmail = `automated-${Date.now()}@example.com`;
const testPassword = "TestPassword123!";

describe("API Health Check", () => {
  it("should return a successful health response", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      message: "Japan Career Tracker API is running!",
    });
  });
});

describe("Application Authentication", () => {
  it("should reject requests from users who are not logged in", async () => {
    const response = await request(app).get("/api/applications");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required.",
    });
  });
});

describe("User Registration", () => {
  it("should reject registration with missing fields", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email and password are required.");
  });

  it("should reject an invalid email address", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "not-an-email",
        password: testPassword,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Please provide a valid email address."
    );
  });

  it("should reject passwords shorter than 8 characters", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "shortpassword@example.com",
        password: "123",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Password must be at least 8 characters."
    );
  });

  it("should successfully register a new user and maintain their session", async () => {
    const client = request.agent(app);

    const response = await client
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Account created successfully.");
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.id).toBeDefined();

    const meResponse = await client.get("/api/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(testEmail);
  });

  it("should reject duplicate email addresses", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "An account with this email already exists."
    );
  });
});

describe("User Login", () => {
  it("should reject login with missing credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email and password are required.");
  });

  it("should reject invalid login credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password.");
  });

  it("should successfully log in and maintain a session", async () => {
    const client = request.agent(app);

    const response = await client
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful.");
    expect(response.body.user.email).toBe(testEmail);

    const meResponse = await client.get("/api/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(testEmail);
  });

  it("should successfully log out and destroy the session", async () => {
    const client = request.agent(app);

    await client.post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    const logoutResponse = await client.post("/api/auth/logout");

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe("Logged out successfully.");

    const meResponse = await client.get("/api/auth/me");

    expect(meResponse.status).toBe(401);
  });
});

const userAEmail = `crud-user-a-${Date.now()}@example.com`;
const userBEmail = `crud-user-b-${Date.now()}@example.com`;

const userAClient = request.agent(app);
const userBClient = request.agent(app);

describe("Job Application CRUD", () => {
  beforeAll(async () => {
    const userAResponse = await userAClient
      .post("/api/auth/register")
      .send({
        email: userAEmail,
        password: "TestPassword123!",
      });

    const userBResponse = await userBClient
      .post("/api/auth/register")
      .send({
        email: userBEmail,
        password: "TestPassword123!",
      });

    expect(userAResponse.status).toBe(201);
    expect(userBResponse.status).toBe(201);
  });

  it("should create a job application", async () => {
    const response = await userAClient
      .post("/api/applications")
      .send({
        company: "Sony",
        position: "Software Engineer",
        location: "Tokyo, Japan",
        salary_min: 5000000,
        salary_max: 7000000,
        salary_currency: "JPY",
        job_url: "https://example.com/job",
        status: "Applied",
        notes: "Automated test application",
      });

    expect(response.status).toBe(201);
    expect(response.body.application.company).toBe("Sony");
    expect(response.body.application.position).toBe("Software Engineer");
    expect(response.body.application.status).toBe("Applied");
    expect(Number(response.body.application.salary_min)).toBe(5000000);
  });

  it("should default a Japanese application to JPY", async () => {
    const response = await userAClient
      .post("/api/applications")
      .send({
        company: "Nintendo",
        position: "Software Engineer",
        country: "JP",
      });

    expect(response.status).toBe(201);
    expect(response.body.application.country).toBe("JP");
    expect(response.body.application.salary_currency).toBe("JPY");
  });

  it("should default a US application to USD", async () => {
    const response = await userAClient
      .post("/api/applications")
      .send({
        company: "Google",
        position: "Software Engineer",
        country: "US",
      });

    expect(response.status).toBe(201);
    expect(response.body.application.country).toBe("US");
    expect(response.body.application.salary_currency).toBe("USD");
  });

  it("should reject an invalid country", async () => {
    const response = await userAClient
      .post("/api/applications")
      .send({
        company: "Invalid Company",
        position: "Software Engineer",
        country: "CA",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Country must be US or JP.");
  });

  it("should reject an invalid work arrangement", async () => {
    const response = await userAClient
      .post("/api/applications")
      .send({
        company: "Invalid Company",
        position: "Software Engineer",
        work_arrangement: "Flexible",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid work arrangement.");
  });

  it("should reject applications with missing company or position", async () => {
    const response = await userAClient
      .post("/api/applications")
      .send({
        company: "",
        position: "Software Engineer",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Company and position are required."
    );
  });

  it("should reject an invalid application status", async () => {
    const response = await userAClient
      .post("/api/applications")
      .send({
        company: "Google",
        position: "Developer",
        status: "Hired",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid application status.");
  });

  it("should retrieve the user's applications", async () => {
    const createResponse = await userAClient
      .post("/api/applications")
      .send({
        company: "Nintendo",
        position: "Backend Developer",
      });

    const response = await userAClient.get("/api/applications");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.applications)).toBe(true);

    expect(
      response.body.applications.some(
        (application: { id: string }) =>
          application.id === createResponse.body.application.id
      )
    ).toBe(true);
  });

  it("should retrieve one application by ID", async () => {
    const createResponse = await userAClient
      .post("/api/applications")
      .send({
        company: "Capcom",
        position: "Game Developer",
      });

    const applicationId = createResponse.body.application.id;

    const response = await userAClient.get(
      `/api/applications/${applicationId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.application.id).toBe(applicationId);
    expect(response.body.application.company).toBe("Capcom");
  });

  it("should update an application", async () => {
    const createResponse = await userAClient
      .post("/api/applications")
      .send({
        company: "Square Enix",
        position: "Developer",
      });

    const applicationId = createResponse.body.application.id;

    const response = await userAClient
      .put(`/api/applications/${applicationId}`)
      .send({
        company: "Square Enix",
        position: "Senior Software Engineer",
        status: "Interview",
      });

    expect(response.status).toBe(200);
    expect(response.body.application.position).toBe(
      "Senior Software Engineer"
    );
    expect(response.body.application.status).toBe("Interview");
  });

  it("should preserve work arrangement when it is not included in an update", async () => {
    const createResponse = await userAClient
      .post("/api/applications")
      .send({
        company: "Microsoft",
        position: "Software Engineer",
        work_arrangement: "Hybrid",
      });

    const applicationId = createResponse.body.application.id;

    const response = await userAClient
      .put(`/api/applications/${applicationId}`)
      .send({
        position: "Senior Software Engineer",
      });

    expect(response.status).toBe(200);
    expect(response.body.application.work_arrangement).toBe("Hybrid");
  });

  it("should allow clearing an existing work arrangement", async () => {
    const createResponse = await userAClient
      .post("/api/applications")
      .send({
        company: "Apple",
        position: "Software Engineer",
        work_arrangement: "On-site",
      });

    const applicationId = createResponse.body.application.id;

    const response = await userAClient
      .put(`/api/applications/${applicationId}`)
      .send({
        work_arrangement: null,
      });

    expect(response.status).toBe(200);
    expect(response.body.application.work_arrangement).toBeNull();
  });

  it("should prevent another user from accessing an application", async () => {
    const createResponse = await userAClient
      .post("/api/applications")
      .send({
        company: "Sony",
        position: "Private Application",
      });

    const applicationId = createResponse.body.application.id;

    const getResponse = await userBClient.get(
      `/api/applications/${applicationId}`
    );

    expect(getResponse.status).toBe(404);

    const updateResponse = await userBClient
      .put(`/api/applications/${applicationId}`)
      .send({
        status: "Offer",
      });

    expect(updateResponse.status).toBe(404);

    const deleteResponse = await userBClient.delete(
      `/api/applications/${applicationId}`
    );

    expect(deleteResponse.status).toBe(404);

    // Confirm the original owner still has access.
    const ownerResponse = await userAClient.get(
      `/api/applications/${applicationId}`
    );

    expect(ownerResponse.status).toBe(200);
  });

  it("should delete an application", async () => {
    const createResponse = await userAClient
      .post("/api/applications")
      .send({
        company: "Test Company",
        position: "Test Position",
      });

    const applicationId = createResponse.body.application.id;

    const deleteResponse = await userAClient.delete(
      `/api/applications/${applicationId}`
    );

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe(
      "Application deleted successfully."
    );

    const getResponse = await userAClient.get(
      `/api/applications/${applicationId}`
    );

    expect(getResponse.status).toBe(404);
  });
});

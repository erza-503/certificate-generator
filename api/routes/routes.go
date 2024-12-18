package routes

import (
	"certificate-generator/internal/handler/middleware"
	"certificate-generator/internal/handler/rest"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// function for setup routes
func RouteSetup(r *fiber.App) {
	r.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "test",
		})
	})

	// CORS Middleware setup
	r.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",                               // Replace with your frontend URL
		AllowMethods:     "GET,POST,PUT,DELETE",                                 // Allowed HTTP methods
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Cookie", // Allowed headers
		ExposeHeaders:    "Cookie",
		AllowCredentials: true,
	}))

	// Define a group routes for API
	api := r.Group("/api")

	// Define routes for authentication
	api.Post("/signup", rest.SignUp)                               // Route for signing up admin
	api.Post("/login", rest.Login)                                 // Route for admin login
	api.Get("/validate", middleware.ValidateCookie, rest.Validate) // Route to check cookie from admin

	// Define api routes
	// Every request to a path with the group "api" always checks the cookie
	// protected := api.Use(middleware.ValidateCookie)

	// Define routes for authentication
	api.Post("/logout", rest.Logout) // Route to logout from account

	// Define routes for management admin accounts
	api.Get("/accounts", rest.GetAdminAccount)           // Route to see all admin accounts
	api.Put("/accounts/:id", rest.EditAdminAccount)      // Route to update password admin account by acc_id
	api.Delete("/accounts/:id", rest.DeleteAdminAccount) // Route to delete admin account by acc_id
	// api.Get("/accounts/:id", rest.GetAccountByID)        								 // Route to see admin account detail by acc_id

	// define routes for management competence
	api.Post("/competence", rest.CreateKompetensi)       // route to create competence data
	api.Get("/competence", rest.GetKompetensi)           // route to get all competence data
	api.Put("/competence/:id", rest.EditKompetensi)      // route to update competence data
	api.Delete("/competence/:id", rest.DeleteKompetensi) // route to delete competence data
	//api.Get("/competence/:id", TEMPlate)               // route to get competence data based on their id

	// define routes for management certificate data
	api.Post("/certificate", rest.CreateCertificate)
	api.Get("/certificate", rest.GetAllCertificates)
	api.Get("/certificate/:id", rest.GetCertificateByID)
	api.Put("/certiticate/:id", TEMPlate)
	api.Delete("/certificate/:id", rest.DeleteCertificate)

	r.Get("/assets/certificate/:id", rest.DownloadCertificate)
}

func TEMPlate(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON("nothing here yet")
}

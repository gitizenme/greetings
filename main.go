package main


import (
	"encoding/json"
	"fmt"
	"net/http"
	"github.com/auth0-community/auth0"
	"github.com/gorilla/mux"
	"gopkg.in/square/go-jose.v2"
	"gopkg.in/square/go-jose.v2/jwt"
	"github.com/gorilla/handlers"
	"os"
)

type Greeting struct {
	Id	int
	Message	string
	Language string
}

var greetings = []Greeting {
	{Id: 1, Message: "Hello", Language: "English"},
	{Id: 2, Message: "Hola", Language: "Spanish"},
}

type jwtHeaderExtractor struct {}

func (e *jwtHeaderExtractor) Extract(r *http.Request) (*jwt.JSONWebToken, error) {
	return auth0.FromHeader(r)
}

func main() {
	// instantiate the router
	r := mux.NewRouter()

	// default page serves static content
	r.Handle("/", http.FileServer(http.Dir("./views/")))
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))

	r.Handle("/greeting", authMiddleware(GreetingsHandler)).Methods("GET")
	r.Handle("/greeting", NotImplemented).Methods("POST")
	r.Handle("/greeting", NotImplemented).Methods("PUT")


	http.ListenAndServe(":3000", handlers.LoggingHandler(os.Stdout, r));
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		secret := []byte("PvJlI6wIlUHgYq37khVTRVuxAEGEcEWj")
		secretProvider := auth0.NewKeyProvider(secret)
		audience := []string{"https://greetings.com/greeting"}

		configuration := auth0.NewConfiguration(secretProvider, audience, "https://greeting.auth0.com/", jose.HS256)
		extractor := jwtHeaderExtractor{}
		validator := auth0.NewValidator(configuration, &extractor)
		token, err := validator.ValidateRequest(r)

		if err != nil {
			fmt.Println(err)
			fmt.Println("Token is not valid:", token)
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Unauthorized"))
		} else {
			next.ServeHTTP(w, r)
		}
	})
}


var GreetingsHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	payload, _ := json.Marshal(greetings)

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(payload))
})

// Here we are implementing the NotImplemented handler. Whenever an API endpoint is hit
// we will simply return the message "Not Implemented"
var NotImplemented = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request){
	payload, _ := json.Marshal("Not Implemented")

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(payload))
})
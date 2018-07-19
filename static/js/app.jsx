var App = React.createClass({
    componentWillMount: function () {
        this.setupAjax();
        this.parseHash();
        this.setState();
    },
    setupAjax: function () {
        $.ajaxSetup({
            'beforeSend': function (xhr) {
                if (localStorage.getItem('access_token')) {
                    xhr.setRequestHeader('Authorization',
                        'Bearer ' + localStorage.getItem('access_token'));
                }
            }
        });
    },
    parseHash: function () {
        this.auth0 = new auth0.WebAuth({
            domain: AUTH0_DOMAIN,
            clientID: AUTH0_CLIENT_ID
        });
        this.auth0.parseHash(window.location.hash, function (err, authResult) {
            if (err) {
                return console.log(err);
            }
            if (authResult !== null && authResult.accessToken !== null && authResult.idToken !== null) {
                localStorage.setItem('access_token', authResult.accessToken);
                localStorage.setItem('id_token', authResult.idToken);
                localStorage.setItem('profile', JSON.stringify(authResult.idTokenPayload));
                window.location = window.location.href.substr(0, window.location.href.indexOf('#'))
            }
        });
    },
    setState: function () {
        var idToken = localStorage.getItem('id_token');
        if (idToken) {
            this.loggedIn = true;
        } else {
            this.loggedIn = false;
        }
    },
    render: function () {

        if (this.loggedIn) {
            return (<LoggedIn/>);
        } else {
            return (<Home/>);
        }
    }
});

var Home = React.createClass({
    authenticate: function () {
        this.webAuth = new auth0.WebAuth({
            domain: AUTH0_DOMAIN,
            clientID: AUTH0_CLIENT_ID,
            scope: 'openid',
            redirectUri: AUTH0_CALLBACK_URL,
            responseType: 'token id_token',
            audience: AUTH0_API_AUDIENCE,
        });
        this.webAuth.authorize();
    },
    render: function () {
        return (
            <div className="container">
                <div className="col-xs-12 jumbotron text-center">
                    <h1>Greetings!</h1>
                    <p>Please sign in to see the latest greetings.</p>
                    <a onClick={this.authenticate} className="btn btn-primary btn-lg btn-login btn-block">Sign In</a>
                </div>
            </div>);
    }
});

var LoggedIn = React.createClass({
    logout: function () {
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('profile');
        location.reload();
    },

    getInitialState: function () {
        return {
            greetings: []
        }
    },
    componentDidMount: function () {
        this.serverRequest = $.get('http://localhost:3000/greeting', function (result) {
            this.setState({
                greetings: result,
            });
        }.bind(this));
    },

    render: function () {
        return (
            <div className="col-lg-12">
                <span className="pull-right"><a onClick={this.logout}>Log out</a></span>
                <h2>Welcome to Greetings</h2>
                <p>The greeting of the day is...</p>
                <div className="row">

                    {this.state.greetings.map(function (greeting, i) {
                        return <Greeting key={i} greeting={greeting}/>
                    })}

                </div>
            </div>);
    }
});

class Greeting extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="col-xs-4">
                <div className="panel panel-default">
                    <div className="panel-heading">{this.props.greeting.Language}</div>
                    <div className="panel-body">
                        {this.props.greeting.Message}
                    </div>
                    <div className="panel-footer">
                    </div>
                </div>
            </div>);
    }
}

ReactDOM.render(<App/>, document.getElementById('app'));

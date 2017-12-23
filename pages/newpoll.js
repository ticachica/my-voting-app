import React from 'react'
import Link from 'next/link'
import fetch from 'unfetch'
import { Row, Col, Form, FormGroup, Label, Input, Button } from 'reactstrap'
import Page from '../components/page'
import Layout from '../components/layout'
import Session from '../components/session'
import Cookies from '../components/cookies'

/**
 * This modules uses 'unfetch', which works like fetch, except - unlike
 * isomorphic-fetch - it sends cookies so can be used with session based
 * authentication to make ssecure requests using HTTP only cookies.
 **/ 

export default class extends Page {

  static async getInitialProps({req, query}) {
    return {
      session: await Session.getSession({force: true, req: req})
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      session: props.session,
      isSignedIn: (props.session.user) ? true : false,
      name: '',
      email: '',
      emailVerified: false,
      linkedWithFacebook: false,
      linkedWithGoogle: false,
      linkedWithTwitter: false,
      alertText: null,
      alertStyle: null,
      _createdBy: '',
      title: '',
      options: [],
    }
    if (props.session.user) {
      this.state.name = props.session.user.name
      this.state.email = props.session.user.email
      this.state._createdBy = props.session.user.id
    }
    this.handleChange = this.handleChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  async componentDidMount() {
    const session = await Session.getSession({force: true})
    this.setState({
      session: session,
      isSignedIn: (session.user) ? true : false
    })

    // If the user bounces off to link/unlink their account we want them to
    // land back here after signing in with the other service / unlinking.
    Cookies.save('redirect_url', '/newpoll')
    
    this.getProfile()
  }
  
  getProfile() {
    fetch('/account/user', {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(user => {
      if (!user.name || !user.email) return
      this.setState({
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        linkedWithFacebook: user.linkedWithFacebook,
        linkedWithGoogle: user.linkedWithGoogle,
        linkedWithTwitter: user.linkedWithTwitter,
        _createdBy: user.id
      })
    })
  }
  
  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  async onSubmit(e) {
    // Submits the URL encoded form without causing a page reload
    e.preventDefault()
    
    this.setState({
      alertText: null,
      alertStyle: null
    })
    
    const formData = {
      _csrf: await Session.getCsrfToken(),
      _createdBy: this.state._createdBy,
      title: this.state.title || '',
    }
    
    // Parse the options input into options String array 
    if (this.state.options.length != 0 ) {
      formData.options = this.state.options.split('\n');
    } else {
      //TODO: Put form validation
      //Did not put in any options. Should reject the form but for now just put dummy options.
      formData.options.push('a','b');
    }
     
    // URL encode form
    // Note: This uses a x-www-form-urlencoded rather than sending JSON so that
    // the form also in browsers without JavaScript
    const encodedForm = Object.keys(formData).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key])
    }).join('&')

    fetch('/newpoll', {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodedForm
    })
    .then(async res => {
      if (res.status === 200) {
        this.getProfile()
        this.setState({
          alertText: 'You new poll has been saved',
          alertStyle: 'alert-success',
          title: '',
          options: '',
        })
        // Force update session so that changes to name or email are reflected
        // immediately in the navbar (as we pass our session to it)
        this.setState({
          session: await Session.getSession({force: true}),
       })
      } else {
        this.setState({
          session: await Session.getSession({force: true}),
          alertText: 'Failed to save changes to your profile',
          alertStyle: 'alert-danger',
        })        
      }
    })
  }

  render() {
    if (this.state.isSignedIn === true) {
      const alert = (this.state.alertText === null) ? <div/> : <div className={`alert ${this.state.alertStyle}`} role="alert">{this.state.alertText}</div>
      
      return (
        <Layout session={this.state.session} navmenu={false}>
          <Row>
            <Col xs="12" className="text-center">
              <h1 className="mb-0">Create a New Poll</h1>
              <p className="lead text-muted">
                Create a new poll with options
              </p>
            </Col>
          </Row>
          <Row>
            <Col xs="12" md="8" lg="9">
              {alert}
              <Form method="post" action="/newpoll" onSubmit={this.onSubmit}>
                <Input name="_csrf" type="hidden" value={this.state.session.csrfToken} onChange={()=>{}}/>
                <Input name="_createdBy" type="hidden" value={this.state._createdBy} onChange={()=>{}}/>
                <FormGroup row>
                  <Label sm={2}>Title</Label>
                  <Col sm={10} md={8}>
                    <Input name="title" value={this.state.title} onChange={this.handleChange}/>
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Label sm={2}>Options:</Label>
                  <Col sm={10} md={8}>
                    <Input name="options" type="textarea" value={this.state.options} onChange={this.handleChange}/>
                  </Col>
                </FormGroup>
                <FormGroup row>
                  <Col sm={12} md={10}>
                    <p className="text-right">
                      <Button color="primary" type="submit">Create Poll</Button>
                    </p>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
          </Row>
        </Layout>
      )
    } else {
      return (
        <Layout session={this.props.session} navmenu={false}>
          <Row>
            <Col xs="12" className="text-center">
              <h1>Create a New Poll</h1>
              <p className="lead" style={{marginBottom: '2em'}}>
                <Link href="/auth/signin"><a>You must be signed in to create a new poll.</a></Link>
              </p>
            </Col>
          </Row>
        </Layout>
      )
    }
  }
}

export class LinkAccount extends React.Component {
  render() {
    if (this.props.linked === true) {
      return (
        <Form action={`/auth/oauth/${this.props.provider.toLowerCase()}/unlink`} method="post">
          <Input name="_csrf" type="hidden" value={this.props.session.csrfToken}/>
          <p>
            <Button block color="danger" type="submit">Unlink from {this.props.provider}</Button>
          </p>
        </Form>
      )
    } else if (this.props.linked === false) {
      return (
        <p>
          <a className="btn btn-block btn-secondary" href={`/auth/oauth/${this.props.provider.toLowerCase()}`}>Link with {this.props.provider}</a>
        </p>
      )
    } else {
      // Still fetching data
      return (<p/>)
    }
  }
}
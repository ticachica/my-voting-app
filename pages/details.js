import Link from 'next/link'
import Router from 'next/router'
import React from 'react'
import fetch from 'unfetch'
import Page from '../components/page'
import Layout from '../components/layout'
import Session from '../components/session'
import Chart from '../components/chart'
import { Collapse, Container, Row, Col, Form, FormGroup, Button, Label, Input  } from 'reactstrap'
import {TwitterButton, TwitterCount} from 'react-social'

export default class extends Page {
    /* eslint no-undefined: "error" */
    static async getInitialProps({req, query: {code} }) { // Inherit standard props from the Page (i.e. with session data)
        let props = await super.getInitialProps({req})
        props.code = code

          // If running on server, perform Async call
        if (typeof window === 'undefined') {
            try {
              props.shareUrl = "http://" + req.headers.host + "/" + code
              props.poll = await this.getPoll(code)
            } catch (e) {
              props.error = "Unable to fetch this poll on server"
            }
        } else {
          props.shareUrl = "http://" + window.location.host + "/polls/" + props.code
        }
        //props.session = await Session.getSession({force: true, req: req})
        props.navmenu = false

        return props
    }

    // Set polls on page load (only if prop is populated, i.e. running on server)
constructor(props) {
    super(props)
    this.state = {
      session: props.session,  
      isSignedIn: (props.session.user) ? true : false,
      poll: props.poll || null,
      code: props.code || null,
      error: props.error || null,
      vote: ' ',
      chartData: {},
      shareUrl: props.shareUrl || null,
      isOpen: false,
      addoption: ' ' 
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePollDelete  = this.handlePollDelete.bind(this);
  }

  async componentDidMount() {
    // Only render polls client side if they are not populate (if the page was 
    // rendered on the server, the state will be inherited from the server 
    // render by the client)
    if (this.state.poll === null) {
      try {
        this.setState({
          poll: null,
          code: null,
          error: null,
          chartData: {},
        })
      } catch (e) {
        this.setState({
          error: "Unable to fetch this poll on client " + e
        })
      }
    }
    this.getPoll(this.state.code);
  }

  getPoll(code) { 
    fetch('/api/polls/'+code, {
      method: 'GET', 
      headers: { 'Content-Type' : 'applicaton/json' },
    })
    .then(r => r.json())
    .then(poll => {
      if (!poll) return

      let labels = [];
      let data = [];
      //Iterate poll.options
      poll.options.map(option => {
        labels.push(option.name)
        data.push(option.vote)
      });
     const voteData = {
        labels: labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)'
          ] 
        }]
      }
  
      this.setState({
        poll: poll,
        vote: poll.options[0].name,
        chartData: voteData
      })
    })
}

/*
updateChartData() {
  let labels = [];
  let data = [];
  //Iterate poll.options
  this.state.poll.options.map(option => {
    labels.push(option.name)
    data.push(option.vote)
  });
}
*/

handleChange(event) {
  if (!this.state.isOpen && event.target.value === 'addoption') { //show add option text input
    this.setState({
      isOpen: true,
    })
  } else if (this.state.isOpen && event.target.type === 'text') { //process the new option input
    this.setState({
      addoption: event.target.value 
    })
  } else { // process someone selecting from the drop down and collapse text input
    this.setState({
      vote: event.target.value,
      isOpen: false,
      addoption: ' '
    });
  }
}

  async handlePollDelete(event) {  
    event.preventDefault()
    
    const code = this.state.poll.code

    const formData = {
      _csrf: await Session.getCsrfToken(),
      code: code
    }

        // URL encode form
    // Note: This uses a x-www-form-urlencoded rather than sending JSON so that
    // the form also in browsers without JavaScript
    const encodedForm = Object.keys(formData).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key])
    }).join('&')

    fetch('/api/delete', {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: encodedForm
      })
      .then( r => r.json() )
      .then(async res => { 
        console.log('deleted poll')
      })
      // After deletion redirect to the home page
      Router.push('/')
}

async handleSubmit(event) {
    // Submits the URL encoded form without causing a page reload
    event.preventDefault()
    const poll = this.state.poll;

    //Test if this is a new option
    if (this.state.isOpen) {
      const newOption = this.state.addoption
      //set up the form 
      const formData = {
        _csrf: await Session.getCsrfToken(),
        code: this.state.poll.code,
        newOption : newOption
      }

      // URL encode form
      // Note: This uses a x-www-form-urlencoded rather than sending JSON so that
      // the form also in browsers without JavaScript
      const encodedForm = Object.keys(formData).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key])
      }).join('&')

      //Call api to add a new option and set vote to 1
      fetch('/newvote', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: encodedForm
      })
      .then(async res => {
        if (res.status === 200) {
            // Make sure to get the updated poll after voting
            //TODO: The chart is not automatically updating.
            this.getPoll(this.state.poll.code)
            alert('Your vote is: ' + this.state.addoption);  
        } else {
            alert('Your vote failed! error: ' + res.status);         
        }
        this.setState({
          isOpen: false,
          addoption: ' '
        }) 
      })
    } else {
      const option = poll.options.find((option) => { 
        return option.name === this.state.vote; 
      });
      const voteCount = Number(option.vote) + 1
      
      const formData = {
          _csrf: await Session.getCsrfToken(),
          code: this.state.poll.code,
          id: option._id,
          voteCount : voteCount
      }

      // URL encode form
      // Note: This uses a x-www-form-urlencoded rather than sending JSON so that
      // the form also in browsers without JavaScript
      const encodedForm = Object.keys(formData).map((key) => {
          return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key])
        }).join('&')

      fetch('/vote', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: encodedForm
      })
      .then(async res => {
        if (res.status === 200) {
            // Make sure to get the updated poll after voting
            //TODO: The chart is not automatically updating.
            this.getPoll(this.state.poll.code)
            alert('Your vote is: ' + this.state.vote);          
        } else {
            alert('Your vote failed!');         
        }
      })
  }
}

    render() {
        if (this.state.error) {
            return <p><strong>Error loading Polls:</strong> {this.state.error}</p>
        } else if (!this.state.poll) {
            // Display place holder if Polls are still loading (and no error)
            return <p><i>Loading content…</i></p>
        } else if (this.state.isSignedIn) {
          const message = "Please check out this poll: " + this.state.poll.title;
            const shareUrl = this.state.shareUrl;

            return (
            <Layout session={this.props.session} navmenu={this.props.navmenu}>
              <Container fluid>
              <Row>
                <Col className="text-center">
                  <h1 className="mb-0">{this.state.poll.title}</h1>
                </Col>
              </Row>
              <Row>
                <Col sm="3">
                  <Form onSubmit={this.handleSubmit}>
                    <FormGroup>
                      <Label for="Voting"><b>Voting Options</b></Label>
                      <Input name="code" type="hidden" value={this.state.poll.code} onChange={()=>{}}/> 
                      <Input name="_csrf" type="hidden" value={this.state.session.csrfToken} onChange={()=>{}}/>
                      <Input type="select" name="vote" id="VotingSelect" value={this.state.vote} onChange={this.handleChange}>
                      {
                        this.state.poll.options.map((option, i) => (
                          <option key={i} value={option.name}>
                            {option.name}
                          </option>
                        ))
                      }
                         <option value="addoption">
                            Add an option...
                          </option>
                     </Input>
                    </FormGroup>
                    <Collapse isOpen={this.state.isOpen}>
                      <FormGroup>
                        Vote with this:
                        <Input type="text" name="newOption" id="newOption" value={this.state.addoption} placeholder="enter write-in" onChange={this.handleChange}/>
                      </FormGroup>
                    </Collapse>
                    <Button color="secondary" type="submit">Submit Vote</Button>
                  </Form>
                  <TwitterButton url={shareUrl} message={message} >
                    <i className="fab fa-twitter-square"></i>
                  </TwitterButton> 
                </Col>
                <Col sm="9">
                  <Chart chartData={this.state.chartData} />
                </Col>
                <Col sm="9">
                  <Form id="deletepoll" value=" " method="post" action="/api/delete" onSubmit={this.handlePollDelete}>
                    <FormGroup>
                      <input name="_csrf" type="hidden" value={this.state.session.csrfToken}/>
                    </FormGroup>
                    <Button type="submit" color="danger">Remove this Poll</Button>
                  </Form>
                </Col>
              </Row>
              </Container>
           </Layout>
            )
        } else {
            const message = "Please check out this poll: " + this.state.poll.title;
            const shareUrl = this.state.shareUrl;

            return (
            <Layout session={this.props.session} navmenu={this.props.navmenu}>
              <Container fluid>
              <Row>
                <Col className="text-center">
                  <h1 className="mb-0">{this.state.poll.title}</h1>
                </Col>
              </Row>
              <Row>
                <Col sm="3">
                  <Form onSubmit={this.handleSubmit}>
                    <FormGroup>
                      <Label for="Voting"><b>Voting Options</b></Label>
                      <Input name="code" type="hidden" value={this.state.poll.code} onChange={()=>{}}/> 
                      <Input name="_csrf" type="hidden" value={this.state.session.csrfToken} onChange={()=>{}}/>
                      <Input type="select" name="vote" id="VotingSelect" value={this.state.vote} onChange={this.handleChange}>
                      {
                        this.state.poll.options.map((option, i) => (
                          <option key={i} value={option.name}>
                            {option.name}
                          </option>
                        ))
                      }
                     </Input>
                    </FormGroup>
                    <Collapse isOpen={this.state.isOpen}>
                      <FormGroup>
                        Vote with this:
                        <Input type="text" name="newOption" id="newOption" value={this.state.addoption} placeholder="enter write-in" onChange={this.handleChange}/>
                      </FormGroup>
                    </Collapse>
                    <Button color="secondary" type="submit">Submit Vote</Button>
                  </Form>
                  <TwitterButton url={shareUrl} message={message} >
                    <i className="fab fa-twitter-square"></i>
                  </TwitterButton> 
                </Col>
                <Col sm="9">
                  <Chart chartData={this.state.chartData} />
                </Col>
                <Col sm="9">
                  <Form id="deletepoll" value=" " method="post" action="/api/delete" onSubmit={this.handlePollDelete}>
                    <FormGroup>
                      <input name="_csrf" type="hidden" value={this.state.session.csrfToken}/>
                    </FormGroup>
                    <Button type="submit" color="danger">Remove this Poll</Button>
                  </Form>
                </Col>
              </Row>
              </Container>
           </Layout>
            )
        }
    }
}
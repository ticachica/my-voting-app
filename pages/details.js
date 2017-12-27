import Link from 'next/link'
import Router from 'next/router'
import React from 'react'
import fetch from 'unfetch'
import Page from '../components/page'
import Layout from '../components/layout'
import Session from '../components/session'
import Chart from '../components/chart'
import { Container, Row, Col, Form, FormGroup, Button, Label, Input  } from 'reactstrap'


export default class extends Page {
    /* eslint no-undefined: "error" */
    static async getInitialProps({req, query: {code} }) { // Inherit standard props from the Page (i.e. with session data)
        let props = await super.getInitialProps({req})
        props.code = code

          // If running on server, perform Async call
        if (typeof window === 'undefined') {
            try {
                props.poll = await this.getPoll(code)
            } catch (e) {
                props.error = "Unable to fetch Polls on server"
            }
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
      chartData: {}
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
          chartData: {}
        })
      } catch (e) {
        this.setState({
          error: "Unable to fetch polls on client"
        })
      }
    }
    this.getPoll(this.state.code);
  }

  getPoll(code) { fetch('/api/polls/'+code, {
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

handleChange(event) {
    this.setState({
        vote: event.target.value
    });
  }

  async handlePollDelete(event) {  
    event.preventDefault()
    
    const code = this.state.poll.code

    const formData = {
      _csrf: await Session.getCsrfToken(),
      code: code
    }
    console.log("code: " + code)

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
      .then(async res => { 
        console.log('deleted poll')
        if (res.status === 204)  {
          console.log('about to reroute to /')
          Router.push('/')
        }
      })
      
    Router.push('/')
}

async handleSubmit(event) {
    // Submits the URL encoded form without causing a page reload
    event.preventDefault()
    const poll = this.state.poll;
    const option = poll.options.find((option) => { return option.name === this.state.vote; });
    const voteCount = Number(option.vote) + 1
    console.log("votes: "+voteCount)
    
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

    render() {
        if (this.state.error) {
            return <p><strong>Error loading Polls:</strong> {this.state.error}</p>
        } else if (!this.state.poll) {
            // Display place holder if Polls are still loading (and no error)
            return <p><i>Loading content…</i></p>
        } else {
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
                  {alert}
                  <Form onSubmit={this.handleSubmit}>
                    <FormGroup>
                      <Label for="Voting"><b>Voting Options</b></Label>
                      <Input name="code" type="hidden" value={this.state.poll.code} onChange={()=>{}}/> 
                      <Input name="_csrf" type="hidden" value={this.state.session.csrfToken} onChange={()=>{}}/>
                      <Input type="select" name="select" id="VotingSelect" value={this.state.vote} onChange={this.handleChange}>
                      {
                        this.state.poll.options.map((option, i) => (
                          <option key={i} value={option.name}>
                            {option.name}
                          </option>
                        ))
                      }
                      </Input>
                    </FormGroup>
                    <Button color="secondary" type="submit">Submit Vote</Button>
                  </Form>
                </Col>
                <Col sm="9">
                  <Chart chartData={this.state.chartData} />
                </Col>
                <Col sm="9">
                  {/* <a href="#" className="btn btn-danger" onClick={this.handlePollDelete}>Remove this Poll</a> */}
                  <Form id="deletepoll" method="post" action="/api/delete" onSubmit={this.handlePollDelete}>
                    <input name="_csrf" type="hidden" value={this.state.session.csrfToken}/>
                    <input name="code" type="hidden" value={this.state.code}/>
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
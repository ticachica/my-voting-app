import Link from 'next/link'
import React from 'react'
import Page from '../components/page'
import Layout from '../components/layout'
import { Row, Col, Nav, NavItem, NavLink } from 'reactstrap'

export default class extends Page {

  render() {
    return (
      <Layout session={this.props.session}>
        <h1>Voting App</h1>
        <p> Below are polls created on <i>my voting app</i></p> 
        <p> TODO: Insert a table with polls </p>
     </Layout>
    )
  }

}
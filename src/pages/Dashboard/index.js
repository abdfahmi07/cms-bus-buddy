import React, { useEffect } from "react"

import { connect } from "react-redux"

// Pages Components
import Miniwidget from "./Miniwidget"

//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../../store/actions"
import { Alert } from "reactstrap"

const Dashboard = props => {
  document.title = "Dashboard | Lexa - Responsive Bootstrap 5 Admin Dashboard"

  const authUser =
    localStorage.getItem("authUser") &&
    JSON.parse(localStorage.getItem("authUser"))
  const breadcrumbItems = [
    { title: "Bus Buddy", link: "#" },
    { title: "Dashboard", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Dashboard", breadcrumbItems)
  })

  const reports = [
    {
      title: "Orders",
      iconClass: "cube-outline",
      total: "1,587",
      average: "+11%",
      badgecolor: "info",
    },
  ]

  return (
    <React.Fragment>
      <Alert color="success">
        Welcome, <strong>{authUser.email}</strong>
      </Alert>
      {/*mimi widgets */}
      {/* <Miniwidget reports={reports} /> */}
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(Dashboard)

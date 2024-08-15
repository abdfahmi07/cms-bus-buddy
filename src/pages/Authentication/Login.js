import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Label,
  Form,
  Alert,
  Input,
  FormFeedback,
} from "reactstrap"

import { useSelector, useDispatch } from "react-redux"
import { createSelector } from "reselect"
import PropTypes from "prop-types"

// Formik validation
import * as Yup from "yup"
import { useFormik } from "formik"
import withRouter from "components/Common/withRouter"

import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { loginUser, socialLogin } from "../../store/actions"
import Swal from "sweetalert2"
// import megamenuImg from "../../assets/images/megamenu-img.png"
import logo from "../../assets/images/logo-bus-buddy.png"
// import logoLightPng from "../../assets/images/logo-.png"
import logoDark from "../../assets/images/logo-bus-buddy-dark.png"

const Login = props => {
  document.title = "Login | Lexa - Responsive Bootstrap 5 Admin Dashboard"

  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const auth = getAuth()
  const navigate = useNavigate()

  const validation = useFormik({
    // enableReinitialize : use this  flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Please Enter Your Email"),
      password: Yup.string().required("Please Enter Your Password"),
    }),
    onSubmit: values => {
      handleSignIn(values)
    },
  })

  const selectLoginState = state => state.Login
  const LoginProperties = createSelector(selectLoginState, login => ({
    error: login.error,
  }))

  const { error } = useSelector(LoginProperties)

  const signIn = type => {
    dispatch(socialLogin(type, props.router.navigate))
  }

  //for facebook and google authentication
  const socialResponse = type => {
    signIn(type)
  }

  const handleSignIn = async values => {
    try {
      setIsLoading(true)
      const { email, password } = values
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      )
      localStorage.setItem("authUser", JSON.stringify(userCredential.user))
      navigate("/")
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      const errorMessage = error.message
      Swal.fire({
        icon: "error",
        title: errorMessage,
        showConfirmButton: false,
        timer: 4000,
      })
    }
  }

  return (
    <React.Fragment>
      <div className="account-pages my-5 pt-sm-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden">
                <CardBody className="pt-0">
                  <h3 className="text-center mt-5 mb-4">
                    <Link to="/" className="d-block auth-logo">
                      <img
                        src={logoDark}
                        alt=""
                        height="35"
                        className="auth-logo-dark"
                      />
                      <img
                        src={logo}
                        alt=""
                        height="35"
                        className="auth-logo-light"
                      />
                    </Link>
                  </h3>

                  <div className="p-3">
                    <h4 className="text-muted font-size-18 mb-1 text-center">
                      Welcome Back !
                    </h4>
                    <p className="text-muted text-center">
                      Sign in to continue to BusBuddy.
                    </p>
                    <Form
                      className="form-horizontal mt-4"
                      onSubmit={e => {
                        e.preventDefault()
                        validation.handleSubmit()
                        return false
                      }}
                    >
                      {error ? <Alert color="danger">{error}</Alert> : null}
                      <div className="mb-3">
                        <Label htmlFor="username">Email</Label>
                        <Input
                          name="email"
                          className="form-control"
                          placeholder="Enter email"
                          type="email"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={
                            validation.touched.email && validation.errors.email
                              ? true
                              : false
                          }
                        />
                        {validation.touched.email && validation.errors.email ? (
                          <FormFeedback type="invalid">
                            {validation.errors.email}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label htmlFor="userpassword">Password</Label>
                        <Input
                          name="password"
                          value={validation.values.password || ""}
                          type="password"
                          placeholder="Enter Password"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.password &&
                            validation.errors.password
                              ? true
                              : false
                          }
                        />
                        {validation.touched.password &&
                        validation.errors.password ? (
                          <FormFeedback type="invalid">
                            {validation.errors.password}
                          </FormFeedback>
                        ) : null}
                      </div>
                      <Row className="mb-2 mt-4">
                        <div className="col-6">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="customControlInline"
                            />
                            <label
                              className="form-check-label"
                              htmlFor="customControlInline"
                            >
                              Remember me
                            </label>
                          </div>
                        </div>
                        <div className="col-6 text-end">
                          <button
                            className="btn btn-primary w-md waves-effect waves-light"
                            type="submit"
                          >
                            Log In
                          </button>
                        </div>
                      </Row>
                    </Form>
                  </div>
                </CardBody>
              </Card>

              <div className="mt-5 text-center">
                <p>
                  Don't have an account ?{" "}
                  <Link to="/register" className="text-primary">
                    {" "}
                    Signup Now{" "}
                  </Link>
                </p>
                © {new Date().getFullYear()} BusBuddy{" "}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default withRouter(Login)

Login.propTypes = {
  history: PropTypes.object,
}

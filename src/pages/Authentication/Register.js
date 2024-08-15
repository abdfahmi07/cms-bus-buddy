import React, { useEffect, useState } from "react"
// Formik Validation
import * as Yup from "yup"
import { useFormik } from "formik"

import logo from "../../assets/images/logo-bus-buddy.png"
import logoDark from "../../assets/images/logo-bus-buddy-dark.png"

// action
import { registerUser, apiError } from "../../store/actions"

//redux
import { useSelector, useDispatch } from "react-redux"
import { createSelector } from "reselect"

import { addDoc, collection, doc, setDoc } from "firebase/firestore"
import { Link, useNavigate } from "react-router-dom"
import {
  Alert,
  Card,
  CardBody,
  Col,
  Container,
  Form,
  FormFeedback,
  Input,
  Label,
  Row,
} from "reactstrap"
import { db } from "config/firebase"
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth"
import Swal from "sweetalert2"

const Register = props => {
  //meta title
  document.title = "Register | Skote - React Admin & Dashboard Template"

  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const auth = getAuth()

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      fullname: "",
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      fullname: Yup.string().required("Please Enter Your Fullname"),
      email: Yup.string().required("Please Enter Your Email"),
      password: Yup.string().required("Please Enter Your Password"),
    }),
    onSubmit: values => {
      handleSignUp(values)
      // dispatch(registerUser(values))
    },
  })

  const handleSignUp = async values => {
    try {
      setIsLoading(true)
      const { fullname, email, password } = values
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )

      const userRef = await setDoc(doc(db, "users", userCredential.user.uid), {
        fullname,
        email,
        role: "admin",
      })

      await addDoc(collection(db, "partnership"), {
        userId: userCredential.user.uid,
      })

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

  const selectAccountState = state => state.Account
  const AccountProperties = createSelector(selectAccountState, account => ({
    user: account.user,
    registrationError: account.registrationError,
    success: account.success,
    // loading: account.loading,
  }))

  const {
    user,
    registrationError,
    success,
    // loading
  } = useSelector(AccountProperties)

  useEffect(() => {
    dispatch(apiError(""))
  }, [dispatch])

  useEffect(() => {
    success && setTimeout(() => navigate("/login"), 2000)
  }, [success, navigate])

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
                      Register
                    </h4>
                    <Form
                      className="form-horizontal mt-4"
                      onSubmit={e => {
                        e.preventDefault()
                        validation.handleSubmit()
                        return false
                      }}
                    >
                      {user && user ? (
                        <Alert color="success">
                          Register User Successfully
                        </Alert>
                      ) : null}

                      {registrationError && registrationError ? (
                        <Alert color="danger">{registrationError}</Alert>
                      ) : null}

                      <div className="mb-3">
                        <Label htmlFor="username">Fullname</Label>
                        <Input
                          name="fullname"
                          type="text"
                          placeholder="Enter fullname"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.fullname || ""}
                          invalid={
                            validation.touched.fullname &&
                            validation.errors.fullname
                              ? true
                              : false
                          }
                        />
                        {validation.touched.fullname &&
                        validation.errors.fullname ? (
                          <FormFeedback type="invalid">
                            {validation.errors.fullname}
                          </FormFeedback>
                        ) : null}
                      </div>

                      <div className="mb-3">
                        <Label htmlFor="useremail">Email</Label>
                        <Input
                          id="email"
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
                          type="password"
                          placeholder="Enter Password"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.password || ""}
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

                      <div className="mb-3 row mt-4">
                        <div className="col-12 text-end">
                          <button
                            className="btn btn-primary w-md waves-effect waves-light"
                            type="submit"
                          >
                            {isLoading ? "Loading..." : "Register"}
                          </button>
                        </div>
                      </div>
                    </Form>
                  </div>
                </CardBody>
              </Card>
              <div className="mt-5 text-center">
                <p>
                  Already have an account ?{" "}
                  <Link to="/login" className="text-primary">
                    {" "}
                    Login{" "}
                  </Link>{" "}
                </p>
                © {new Date().getFullYear()} BusBuddy
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default Register

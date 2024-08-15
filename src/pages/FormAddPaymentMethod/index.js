import { AvField, AvForm } from "availity-reactstrap-validation"
import { MDBDataTable } from "mdbreact"
import React, { useCallback, useEffect, useState } from "react"
import { connect } from "react-redux"
import { Link, NavLink, useNavigate, useParams } from "react-router-dom"
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Col,
  Form,
  FormGroup,
  InputGroup,
  Label,
  Row,
} from "reactstrap"
import { setBreadcrumbItems } from "store/actions"
import "flatpickr/dist/themes/material_blue.css"
import Flatpickr from "react-flatpickr"
import Dropzone from "react-dropzone"
import Select from "react-select"
import { useFormik } from "formik"
import axios from "axios"
import _ from "lodash"
import {
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable,
} from "firebase/storage"
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
} from "firebase/firestore"
import { db, storage } from "config/firebase"
import Swal from "sweetalert2"

const FormAddPaymentMethod = props => {
  document.title = "Form Add Payment Method | Bus Buddy"

  const breadcrumbItems = [
    { title: "Bus Buddy", link: "#" },
    { title: "Add Payment Method", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Add Payment Method", breadcrumbItems)
  })

  const [paymentMethodOptions, setPaymentMethodOptions] = useState([])

  const { partnershipId } = useParams()
  const navigate = useNavigate()

  const formik = useFormik({
    initialValues: {
      accountNumber: "",
      id: "",
      onBehalf: "",
    },
    onSubmit: values => {
      handleAddPaymentMethod(values)
    },
  })

  console.log(formik.values)

  const handleAddPaymentMethod = async values => {
    try {
      const {
        accountNumber,
        id: { value: valueId },
        onBehalf,
      } = values

      const partnershipRef = doc(db, "partnership", partnershipId)
      const paymentMethodRef = doc(db, "paymentMethods", valueId)

      const payloads = {
        accountNumber,
        id: paymentMethodRef,
        onBehalf,
      }

      await updateDoc(partnershipRef, {
        paymentMethods: arrayUnion(payloads),
      })

      Swal.fire({
        icon: "success",
        title: "Payment method baru berhasil ditambahkan",
        showConfirmButton: false,
        timer: 4000,
      })

      navigate("/payment-methods")
    } catch (err) {
      console.log(err)
    }
  }

  const getPaymentMethods = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "paymentMethods"))
      const formattedPaymentMethods = querySnapshot.docs.map(doc => {
        const paymentMethodData = doc.data()
        const paymentMethodId = doc.id

        return {
          label: paymentMethodData.bank,
          value: paymentMethodId,
        }
      })

      setPaymentMethodOptions([
        {
          label: "Payment Methods",
          options: formattedPaymentMethods,
        },
      ])
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getPaymentMethods()
    return () => {}
  }, [])

  return (
    <React.Fragment>
      <Row>
        <Col className="col-12">
          <Card>
            <CardBody>
              <CardTitle className="h4 mb-4">Form Add Payment Method</CardTitle>
              <form onSubmit={formik.handleSubmit}>
                <Row>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom01">Account Number</Label>
                      <input
                        value={formik.values.accountNumber}
                        name="accountNumber"
                        className="form-control"
                        type="text"
                        placeholder="Enter Account Number"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Payment Method</Label>
                      <Select
                        value={formik.values.id}
                        onChange={selectedOption => {
                          formik.setFieldValue("id", selectedOption)
                        }}
                        placeholder="Select Payment Method"
                        options={paymentMethodOptions}
                        classNamePrefix="select2-selection"
                      />
                    </div>
                  </Col>
                  <Col md="6">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">On Behalf</Label>
                      <input
                        value={formik.values.onBehalf}
                        name="onBehalf"
                        className="form-control"
                        type="text"
                        placeholder="Enter On Behalf"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                </Row>
                <FormGroup className="mb-0 d-flex justify-content-end">
                  <div>
                    <Button type="reset" color="secondary">
                      Cancel
                    </Button>
                    <Button type="submit" color="primary" className="ms-1">
                      Submit
                    </Button>
                  </div>
                </FormGroup>
              </form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(FormAddPaymentMethod)

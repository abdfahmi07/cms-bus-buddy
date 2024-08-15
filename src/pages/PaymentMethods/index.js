import { MDBDataTable } from "mdbreact"
import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { NavLink } from "react-router-dom"
import { Card, CardBody, CardTitle, Col, Row } from "reactstrap"
import { setBreadcrumbItems } from "store/actions"
import {
  arrayRemove,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { db } from "config/firebase"
import Swal from "sweetalert2"

const PaymentMethods = props => {
  document.title = "Dashboard | Lexa - Responsive Bootstrap 5 Admin Dashboard"

  const authUser =
    localStorage.getItem("authUser") &&
    JSON.parse(localStorage.getItem("authUser"))
  const [partnershipId, setPartnershipId] = useState("")
  const [paymentMethods, setPaymentMethods] = useState({
    columns: [
      {
        label: "Account Number",
        field: "accountNumber",
        sort: "asc",
        width: 250,
      },
      {
        label: "Bank",
        field: "bank",
        sort: "asc",
        width: 200,
      },
      {
        label: "On Behalf",
        field: "onBehalf",
        sort: "asc",
        width: 150,
      },

      {
        label: "Method",
        field: "method",
        sort: "asc",
        width: 100,
      },

      {
        label: "Actions",
        field: "actions",
        sort: "asc",
      },
    ],
  })
  const breadcrumbItems = [
    { title: "Bus Buddy", link: "#" },
    { title: "Payment Methods", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Payment Methods", breadcrumbItems)
  })

  const getPaymentMethods = async () => {
    try {
      const rows = []
      const query1 = query(
        collection(db, "partnership"),
        where("userId", "==", authUser.uid),
      )
      const querySnapshot = await getDocs(query1)
      querySnapshot.forEach(doc => {
        const partnership = doc.data()
        const partnershipId = doc.id

        setPartnershipId(partnershipId)

        const paymentMethodsData = partnership.paymentMethods

        if (paymentMethodsData) {
          console.log(paymentMethodsData)
          paymentMethodsData.forEach(async (paymentMethodData, idx) => {
            const paymentMethodDetailDoc = await getDoc(paymentMethodData.id)
            const paymentMethodDetailData = paymentMethodDetailDoc.data()
            const paymentMethodDetailId = paymentMethodDetailDoc.id

            rows.push({
              accountNumber: paymentMethodData.accountNumber,
              bank: paymentMethodDetailData.bank,
              onBehalf: paymentMethodData.onBehalf,
              method: paymentMethodDetailData.method,
              actions: (
                <div className="d-flex gap-2 w-25">
                  <NavLink
                    to={`/payment-methods/${partnershipId}/edit-payment-methods/${idx}`}
                  >
                    <button type="button" className="btn btn-warning">
                      <i className="ion ion-md-create"></i>
                    </button>
                  </NavLink>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      handleDeletePaymentMethod(
                        partnershipId,
                        paymentMethodData,
                      )
                    }
                  >
                    <i className="ion ion-md-trash"></i>
                  </button>
                </div>
              ),
            })
            console.log(rows)
            setPaymentMethods(prevState => ({ ...prevState, rows: rows }))
          })
        }
      })
    } catch (err) {
      console.log(err)
    }
  }

  const handleDeletePaymentMethod = (partnershipId, paymentMethodVal) => {
    try {
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: "btn btn-success",
          cancelButton: "btn btn-danger",
        },
        buttonsStyling: false,
      })

      Swal.fire({
        title: "Apakah sudah yakin?",
        text: "Anda tidak akan bisa mengembalikan data ini",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Iya, sudah yakin",
        cancelButtonText: "Tidak, belum yakin",
        reverseButtons: true,
      }).then(async result => {
        if (result.isConfirmed) {
          await updateDoc(doc(db, "partnership", partnershipId), {
            paymentMethods: arrayRemove(paymentMethodVal),
          })

          swalWithBootstrapButtons.fire({
            title: "Data dihapus!",
            text: "Data bus kamu sudah berhasil dihapus",
            icon: "success",
          })

          window.location.reload()
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            title: "Dibatalkan",
            text: "Data bus kamu masih aman",
            icon: "error",
          })
        }
      })
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
              <div className="d-flex justify-content-between mb-3">
                <CardTitle className="h4">Payment Methods</CardTitle>
                <NavLink
                  to={`/payment-methods/${partnershipId}/add-payment-methods`}
                >
                  <button type="submit" className="btn btn-primary">
                    <i className="ion ion-md-add-circle"></i> Add Payment Method
                  </button>
                </NavLink>
              </div>

              <MDBDataTable
                noBottomColumns
                responsive
                striped
                hover
                data={paymentMethods}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(PaymentMethods)

import { MDBDataTable } from "mdbreact"
import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { NavLink, useParams } from "react-router-dom"
import { Badge, Card, CardBody, CardTitle, Col, Row } from "reactstrap"
import { setBreadcrumbItems } from "store/actions"
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore"
import { db } from "config/firebase"
import "./index.css"
import Lightbox from "react-image-lightbox"
import Swal from "sweetalert2"

const Orders = props => {
  document.title = "Dashboard | Lexa - Responsive Bootstrap 5 Admin Dashboard"

  const { busId } = useParams()
  const [isEffects, setIsEffects] = useState(false)
  // const [orderPath, setOrderPath] = useState("")
  const [paymentProofThumb, setPaymentProofThumb] = useState("")
  const [orders, setOrders] = useState({
    columns: [
      {
        label: "Buyer Name",
        field: "buyerName",
        sort: "asc",
        width: 250,
        fixed: "left",
      },
      {
        label: "Buyer Email",
        field: "buyerEmail",
        sort: "asc",
        width: 150,
        fixed: "left",
      },
      {
        label: "Buyer Phone",
        field: "buyerPhone",
        sort: "asc",
        width: 200,
        fixed: "left",
      },
      {
        label: "Payment Proof",
        field: "paymentProof",
        sort: "asc",
        width: 100,
      },
      {
        label: "Payment Status",
        field: "paymentStatus",
        sort: "asc",
        width: 100,
      },

      {
        label: "Total Price",
        field: "totalPrice",
        sort: "asc",
        width: 100,
      },
      {
        label: "Payment Method",
        field: "paymentMethod",
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
    { title: "Orders", link: "#" },
  ]

  useEffect(() => {
    props.onSetBreadCrumbs("Orders", breadcrumbItems)
  })

  const handleUpdateStatusOrder = async (paymentId, orderPathVal) => {
    try {
      const seatsSnapshot = await getDocs(
        collection(db, `${orderPathVal}/seats`),
      )

      const seats = seatsSnapshot.docs.map(seatDoc => {
        const seatsData = seatDoc.data()

        return seatsData.seat
      })

      const busRef = doc(db, "buses", busId)
      const busDoc = await getDoc(busRef)

      if (busDoc.exists()) {
        const bus = busDoc.data()

        await updateDoc(doc(db, `/buses/${busId}`), {
          bookedSeats: arrayUnion(...seats),
          remainingSeats: bus.remainingSeats - seats.length,
        })

        await updateDoc(doc(db, `/buses/${busId}/payments/${paymentId}`), {
          paymentStatus: "COMPLETED",
        })

        Swal.fire({
          icon: "success",
          title: "Payment berhasil di-approve",
          text: "Silahkan cek status pembayaran yang terkait",
          showConfirmButton: false,
          timer: 4000,
        })

        window.location.reload()
      }
    } catch (err) {
      console.log(err)
    }
  }

  const getOrders = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, `/buses/${busId}/orders`),
      )
      const formattedOrders = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const orderData = doc.data()
          const orderId = doc.id
          const orderPath = doc.ref.path

          const paymentRef = orderData.paymentId
          if (paymentRef) {
            const paymentDoc = await getDoc(paymentRef)
            if (paymentDoc.exists()) {
              const paymentData = paymentDoc.data()
              const paymentId = paymentDoc.id

              const paymentMethodRef = paymentData.paymentMethodId

              if (paymentMethodRef) {
                const paymentMethodDoc = await getDoc(paymentMethodRef)

                if (paymentMethodDoc.exists()) {
                  const paymentMethodData = paymentMethodDoc.data()
                  const paymentMethodId = paymentMethodDoc.id

                  return {
                    order: {
                      orderPath,
                      orderId,
                      ...orderData,
                    },
                    payment: {
                      paymentId,
                      ...paymentData,
                    },
                    paymentMethod: {
                      paymentMethodId,
                      ...paymentMethodData,
                    },
                  }
                }
              }
            }
          }
        }),
      )

      const formattedRows = formattedOrders.map(formattedOrder => {
        return {
          buyerName: formattedOrder.order.buyerName,
          buyerEmail: formattedOrder.order.buyerEmail,
          buyerPhone: formattedOrder.order.buyerPhone,
          paymentProof: (
            <img
              onClick={() => {
                setPaymentProofThumb(formattedOrder.payment.paymentProof)
                setIsEffects(true)
              }}
              className="img-fluid"
              alt=""
              src={formattedOrder.payment.paymentProof}
              width="75"
            />
          ),
          paymentStatus: (
            <Badge
              color={`${formattedOrder.payment.paymentStatus === "COMPLETED" ? "success" : "warning"}`}
              className={`${formattedOrder.payment.paymentStatus === "COMPLETED" ? "bg-success" : "bg-warning"}`}
            >
              {formattedOrder.payment.paymentStatus}
            </Badge>
          ),
          totalPrice: formattedOrder.payment.totalPrice,
          paymentMethod: `Bank ${formattedOrder.paymentMethod.bank}`,
          actions: (
            <div className="d-flex gap-2 w-25">
              <button
                onClick={() =>
                  handleUpdateStatusOrder(
                    formattedOrder.payment.paymentId,
                    formattedOrder.order.orderPath,
                  )
                }
                type="submit"
                className="btn btn-success"
                disabled={formattedOrder.payment.paymentStatus === "COMPLETED"}
              >
                <i className="ion ion-md-checkmark"></i>
              </button>
            </div>
          ),
        }
      })

      setOrders(prevState => ({ ...prevState, rows: formattedRows }))
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getOrders()
    return () => {}
  }, [])

  return (
    <React.Fragment>
      <Row>
        <Col className="col-12">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between mb-3">
                <CardTitle className="h4">Orders</CardTitle>
                {/* <NavLink to="/add-bus">
                  <button type="submit" className="btn btn-primary">
                    <i className="ion ion-md-add-circle"></i> Add Payment Method
                  </button>
                </NavLink> */}
              </div>

              <MDBDataTable
                noBottomColumns
                responsive
                striped
                hover
                data={orders}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      {isEffects && paymentProofThumb ? (
        <Lightbox
          mainSrc={paymentProofThumb}
          enableZoom={false}
          onCloseRequest={() => {
            setIsEffects(!isEffects)
          }}
        />
      ) : null}
    </React.Fragment>
  )
}

const mapDispatchToProps = dispatch => ({
  onSetBreadCrumbs: (title, breadcrumbItems) =>
    dispatch(setBreadcrumbItems(title, breadcrumbItems)),
})

export default connect(null, mapDispatchToProps)(Orders)

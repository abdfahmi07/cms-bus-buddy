import { MDBDataTable } from "mdbreact"
import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { Link, NavLink } from "react-router-dom"
import { Card, CardBody, CardTitle, Col, Modal, Row } from "reactstrap"
import { setBreadcrumbItems } from "store/actions"
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore"
import { db } from "config/firebase"
import Lightbox from "react-image-lightbox"
import {
  formatToDate,
  formatToDateString,
  formatToTime,
} from "helpers/date_helper"
import { convertNumberToCurrency } from "helpers/number_helper"
import Swal from "sweetalert2"
import moment from "moment"

moment.locale()

const Buses = props => {
  document.title = "Dashboard | Lexa - Responsive Bootstrap 5 Admin Dashboard"

  const [bus, setBus] = useState({})
  const [isGallery, setIsGallery] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [buses, setBuses] = useState({
    columns: [
      {
        label: "Name",
        field: "name",
        sort: "asc",
        width: 250,
      },
      {
        label: "Type",
        field: "type",
        sort: "asc",
        width: 150,
      },
      {
        label: "Route",
        field: "route",
        sort: "asc",
        width: 200,
      },
      {
        label: "Travel Time",
        field: "travelTime",
        sort: "asc",
        width: 100,
      },
      {
        label: "Remaining Seats",
        field: "remainingSeats",
        sort: "asc",
        width: 100,
      },
      {
        label: "Price",
        field: "price",
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
  const [modalDetailBus, setModalDetailBus] = useState(false)
  const authUser =
    localStorage.getItem("authUser") &&
    JSON.parse(localStorage.getItem("authUser"))

  const breadcrumbItems = [
    { title: "Bus Buddy", link: "#" },
    { title: "Buses", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Buses", breadcrumbItems)
  })

  const removeBodyCss = () => {
    document.body.classList.add("no_padding")
  }

  const handleShowDetailBus = async busId => {
    try {
      toggleModalDetailBus()
      const busesRef = doc(db, "buses", busId)
      const bus = await getDoc(busesRef)

      if (bus.exists()) {
        setBus({ ...bus.data(), id: bus.id })
      } else {
        console.log("No such document!")
      }
    } catch (err) {
      console.log(err)
    }
  }

  const toggleModalDetailBus = () => {
    setModalDetailBus(!modalDetailBus)
    removeBodyCss()
  }

  const handleDeleteBus = busId => {
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
          await deleteDoc(doc(db, "buses", busId))

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

  const getBuses = async () => {
    try {
      const rows = []
      const queryPartnership = query(
        collection(db, "partnership"),
        where("userId", "==", authUser.uid),
        limit(1),
      )
      const querySnapshotPartnership = await getDocs(queryPartnership)

      if (!querySnapshotPartnership.empty) {
        const partnershipDoc = querySnapshotPartnership.docs[0]
        const partnershipDocRef = partnershipDoc.ref
        const partnershipDocId = partnershipDoc.id

        localStorage.setItem("partnershipDocId", partnershipDocId)

        const query1 = query(
          collection(db, "buses"),
          where("partnershipId", "==", partnershipDocRef),
        )

        const querySnapshot = await getDocs(query1)
        querySnapshot.forEach(doc => {
          const bus = doc.data()
          const busId = doc.id

          rows.push({
            name: bus.name,
            type: bus.type,
            route: `${bus.departureLocation.place}, ${bus.departureLocation.city} - ${bus.destinationLocation.place}, ${bus.destinationLocation.city}`,
            travelTime: `${formatToDateString(bus.departureTime, "DD MMM")} ${formatToTime(bus.departureTime)} - ${formatToDateString(bus.arrivalTime, "DD MMM")} ${formatToTime(bus.arrivalTime)}`,
            remainingSeats: `${bus.remainingSeats} Seats`,
            price: `${bus.price}`,
            actions: (
              <div className="d-flex gap-2 w-25">
                <button
                  onClick={() => handleShowDetailBus(busId)}
                  type="button"
                  className="btn btn-info"
                >
                  <i className="ion ion-md-eye"></i>
                </button>
                <NavLink to={`/buses/${busId}/edit-bus`}>
                  <button type="button" className="btn btn-warning">
                    <i className="ion ion-md-create"></i>
                  </button>
                </NavLink>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteBus(busId)}
                >
                  <i className="ion ion-md-trash"></i>
                </button>
                <NavLink to={`/buses/${busId}/orders`}>
                  <button type="button" className="btn btn-primary">
                    <i className="mdi mdi-clipboard-file"></i>
                  </button>
                </NavLink>
              </div>
            ),
          })
        })
        setBuses(prevState => ({ ...prevState, rows: rows }))
      }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getBuses()
    return () => {}
  }, [])

  return (
    <React.Fragment>
      <Row>
        <Col className="col-12">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between mb-3">
                <CardTitle className="h4">Buses</CardTitle>
                <NavLink to="/add-bus">
                  <button type="submit" className="btn btn-primary">
                    <i className="ion ion-md-add-circle"></i> Add Bus
                  </button>
                </NavLink>
              </div>

              <MDBDataTable
                hover
                noBottomColumns
                responsive
                striped
                data={buses}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Modal
        size="lg"
        isOpen={modalDetailBus}
        toggle={() => {
          toggleModalDetailBus()
        }}
      >
        <div className="modal-header">
          <h5 className="modal-title mt-0" id="myLargeModalLabel">
            Detail Bus
          </h5>
          <button
            onClick={() => {
              setModalDetailBus(false)
            }}
            type="button"
            className="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <div className="d-flex flex-column">
            <h6>{bus.name}</h6>
            <p>{bus.type}</p>
            <div className="d-flex flex-column column-gap-2 mb-4">
              <h6>Price</h6>
              <div>
                <p className="m-0">
                  Rp {convertNumberToCurrency(bus.price, "ID")}
                </p>
              </div>
            </div>
            <div className="d-flex flex-column column-gap-2 mb-4">
              <h6>Images</h6>
              <div className="popup-gallery d-flex column-gap-4 ">
                {bus.images?.map((image, idx) => {
                  return (
                    <Link to="#" className="float-start">
                      <div className="img-responsive">
                        <img
                          src={image.path}
                          onClick={() => {
                            setIsGallery(true)
                            setPhotoIndex(idx)
                            toggleModalDetailBus()
                          }}
                          alt=""
                          width="120"
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="d-flex flex-column column-gap-2">
              <h6>Travel Time</h6>
              <div className="d-flex column-gap-2">
                <p className="m-0">
                  {bus.departureTime &&
                    `${formatToDateString(bus.departureTime, "dddd, DD MMMM")}, ${formatToTime(bus.departureTime)}`}
                </p>
                <p>-</p>
                <p className="m-0">
                  {bus.arrivalTime &&
                    `${formatToDateString(bus.arrivalTime, "dddd, DD MMMM")}, ${formatToTime(bus.arrivalTime)}`}
                </p>
              </div>
            </div>
            <div className="d-flex flex-column column-gap-2">
              <h6>Departure Location</h6>
              <div>
                <p className="m-0">{bus.departureLocation?.city}</p>
                <p className="m-0">{bus.departureLocation?.place}</p>
              </div>
            </div>
            <div className="d-flex flex-column column-gap-2 mt-3">
              <h6>Departure Location</h6>
              <div>
                <p className="m-0">{bus.destinationLocation?.city}</p>
                <p className="m-0">{bus.destinationLocation?.place}</p>
              </div>
            </div>
            <div className="d-flex flex-column column-gap-2 mt-3">
              <h6>Facilities</h6>
              <ul className="">
                {bus.facilities?.map(facility => {
                  return (
                    <li>
                      {facility.type === "seatAmount"
                        ? `Kapasitas ${facility.name} Kursi`
                        : facility.type === "seatSetting"
                          ? `Pengaturan Kursi ${facility.name}`
                          : facility.type === "ac"
                            ? `Full ${facility.name}`
                            : facility.name}
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="d-flex flex-column column-gap-2 mt-2 ">
              <h6>Seats</h6>
              <div>
                <p className="m-0">{`Column Seat (${bus.seatColumn})`}</p>
                <p className="m-0">{`Row Seat (${bus.seatRow})`}</p>
                <p className="m-0">{`Aisle Column (${bus.aisleColumn})`}</p>
                <p className="m-0">{`Remaining Seats (${bus.remainingSeats} Kursi)`}</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {bus.images && isGallery && (
        <Lightbox
          mainSrc={bus.images[photoIndex].path}
          nextSrc={bus.images[(photoIndex + 1) % bus.images.length].path}
          prevSrc={
            bus.images[(photoIndex + bus.images.length - 1) % bus.images.length]
          }
          enableZoom={true}
          onCloseRequest={() => {
            setIsGallery(false)
          }}
          onMovePrevRequest={() => {
            setPhotoIndex(
              (photoIndex + bus.images.length - 1) % bus.images.length,
            )
          }}
          onMoveNextRequest={() => {
            setPhotoIndex((photoIndex + 1) % bus.images.length)
          }}
          imageCaption={bus.images[photoIndex].caption}
        />
      )}
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(Buses)

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
import { addDoc, collection, doc, getDoc, Timestamp } from "firebase/firestore"
import { db, storage } from "config/firebase"
import { formatToDate } from "helpers/date_helper"
import moment from "moment"

const FormEditBus = props => {
  document.title = "Form Edit Bus | Bus Buddy"

  const breadcrumbItems = [
    { title: "Bus Buddy", link: "#" },
    { title: "Edit Bus", link: "#" },
  ]

  useEffect(() => {
    props.setBreadcrumbItems("Edit Bus", breadcrumbItems)
  })

  const [selectedFiles, setselectedFiles] = useState([])
  const [selectedGroup, setselectedGroup] = useState(null)
  const [selectedFacilities, setSelectedFacilities] = useState(null)
  const [locations, setLocations] = useState([])
  const [bus, setBus] = useState({})

  const { busId } = useParams()
  const navigate = useNavigate()
  const seatSettingOptions = [
    {
      label: "Setting",
      options: [
        { label: "2-2", value: "2-2" },
        { label: "2-3", value: "2-3" },
        { label: "3-3", value: "3-3" },
      ],
    },
  ]

  const otherFacilityOptions = [
    {
      label: "Other Facilities",
      options: [
        { label: "WiFi", value: "WiFi", type: "wifi" },
        { label: "Full AC", value: "AC", type: "ac" },
        { label: "Hiburan", value: "Entertainment", type: "entertainment" },
        { label: "Toilet", value: "Toilet", type: "toilet" },
      ],
    },
  ]

  const formik = useFormik({
    initialValues: {
      name: "",
      type: "",
      price: "",
      departureTime: "",
      arrivalTime: "",
      facilities: [
        { name: "", type: "seatAmount" },
        {
          name: "",
          type: "seatSetting",
        },
      ],
      seatColumn: "",
      seatRow: "",
      aisleColumn: "",
      departureLocation: {
        city: "",
        place: "",
      },
      destinationLocation: {
        city: "",
        place: "",
      },
    },
    onSubmit: values => {
      handleAddNewBus(values)
    },
  })

  const debouncedChangeHandler = useCallback(
    _.debounce((value, field) => {
      searchLocation(value, field)
    }, 500),
    [],
  )

  const handleSearchLocation = async (value, field) => {
    // formik.setFieldValue(field, value)
    debouncedChangeHandler(value, field)
  }

  const searchLocation = async (value, field) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BASE_URL_IDN_AREA}/regencies`,
        {
          params: {
            name: value,
            limit: 10,
          },
        },
      )

      const locationsRaw = data.data
      const formattedLocations = locationsRaw.map(locationRaw => ({
        label: locationRaw.name,
        value: locationRaw.name,
      }))

      setLocations([
        {
          label: "City",
          options: formattedLocations,
        },
      ])
    } catch (err) {
      console.log(err)
    }
  }

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  const handleAcceptedFiles = async files => {
    files.forEach(file => {
      const storageRef = ref(storage, `uploads/${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        "state_changed",
        snapshot => {
          // Progress function (optional)
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Upload is ${progress}% done`)
        },
        error => {
          // Handle unsuccessful uploads
          console.error("Upload failed:", error)
        },
        () => {
          // Handle successful uploads on complete
          getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
            setselectedFiles(prevFiles => [
              ...prevFiles,
              {
                fileRaw: file,
                preview: URL.createObjectURL(file),
                formattedSize: formatBytes(file.size),
                downloadUrl: downloadURL,
              },
            ])
            console.log("File available at", downloadURL)
          })
        },
      )
    })
  }

  const handleSelectGroup = selectedGroup => {
    setselectedGroup(selectedGroup)
  }

  const handleSelectLocation = (value, field) => {
    console.log(value.value)
    formik.setFieldValue(field, value.value)
  }

  const handleMultipleFacility = selectedFacilityItems => {
    setSelectedFacilities(selectedFacilityItems)
  }

  console.log(selectedFacilities)
  console.log(formik.values)

  const handleAddNewBus = async values => {
    try {
      const {
        name,
        type,
        price,
        departureLocation,
        destinationLocation,
        departureTime,
        arrivalTime,
        facilities,
        seatColumn,
        seatRow,
        aisleColumn,
      } = values
      const formattedFacilities = selectedFacilities.map(selectedFacility => ({
        name: selectedFacility.value,
        type: selectedFacility.type,
      }))
      const formattedImages = selectedFiles.map(selectedFile => ({
        caption: selectedFile.fileRaw.name.split(".")[0],
        path: selectedFile.downloadUrl,
      }))
      const partnershipRef = doc(db, "partnership", "VjaZLkG2cT9aoJOIExIp")

      const payloads = {
        name,
        type,
        price,
        departureLocation,
        destinationLocation,
        departureTime: Timestamp.fromDate(departureTime),
        arrivalTime: Timestamp.fromDate(arrivalTime),
        facilities: [
          { ...facilities[0] },
          { ...facilities[1], name: facilities[1].name.value },
          ...formattedFacilities,
        ],
        images: formattedImages,
        seatColumn,
        seatRow,
        aisleColumn,
        partnershipId: partnershipRef,
      }

      console.log(payloads)
      const docRef = await addDoc(collection(db, "buses"), payloads)
      navigate("/buses")
      console.log("Document written with ID: ", docRef.id)
    } catch (err) {
      console.log(err)
    }
  }

  const getDetailBus = async () => {
    try {
      const busesRef = doc(db, "buses", busId)
      const busDoc = await getDoc(busesRef)

      if (busDoc.exists()) {
        const bus = busDoc.data()
        setselectedFiles(bus.images)
        const formattedFacilites = bus.facilities.map(
          facilty =>
            facilty.type !== "seatAmount" &&
            facilty.type !== "seatSetting" && {
              label:
                facilty.type === "ac" ? `Full ${facilty.name}` : facilty.name,
              value: facilty.name,
              type: facilty.type,
            },
        )
        setSelectedFacilities(formattedFacilites)
        formik.setValues({
          name: bus.name,
          type: bus.type,
          price: bus.price,
          departureTime: formatToDate(bus.departureTime),
          arrivalTime: formatToDate(bus.arrivalTime),
          facilities: [
            { name: bus.facilities[0].name, type: "seatAmount" },
            {
              name: {
                label: bus.facilities[1].name,
                value: bus.facilities[1].name,
              },
              type: "seatSetting",
            },
          ],
          seatColumn: bus.seatColumn,
          seatRow: bus.seatRow,
          aisleColumn: bus.aisleColumn,
          departureLocation: {
            city: bus.departureLocation.city,
            place: bus.departureLocation.place,
          },
          destinationLocation: {
            city: bus.destinationLocation.city,
            place: bus.destinationLocation.place,
          },
        })
      } else {
        console.log("No such document!")
      }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getDetailBus()
    return () => {}
  }, [])

  return (
    <React.Fragment>
      <Row>
        <Col className="col-12">
          <Card>
            <CardBody>
              <CardTitle className="h4 mb-4">Form Edit Bus</CardTitle>
              <form onSubmit={formik.handleSubmit}>
                <Row>
                  <h6 className="fw-semibold mb-3">Detail Bus</h6>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom01">Name</Label>
                      <input
                        value={formik.values.name}
                        name="name"
                        className="form-control"
                        type="text"
                        placeholder="Enter Place"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom02">Type</Label>
                      <input
                        value={formik.values.type}
                        name="type"
                        className="form-control"
                        type="text"
                        placeholder="Enter Type"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                  <Col md="6">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Price</Label>
                      <input
                        value={formik.values.price}
                        name="price"
                        className="form-control"
                        type="text"
                        placeholder="Enter Price"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md="12">
                    <Form>
                      <Label htmlFor="images">Images</Label>
                      <Dropzone
                        onDrop={acceptedFiles => {
                          handleAcceptedFiles(acceptedFiles)
                        }}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <div className="dropzone dz-clickable">
                            <div
                              className="dz-message needsclick"
                              {...getRootProps()}
                            >
                              <input {...getInputProps()} />
                              <div className="mb-3">
                                <i className="mdi mdi-cloud-upload-outline text-muted display-4"></i>
                              </div>
                              <h4>Drop files here or click to upload.</h4>
                            </div>
                          </div>
                        )}
                      </Dropzone>
                      <div
                        className="dropzone-previews mt-3"
                        id="file-previews"
                      >
                        {selectedFiles.map((f, i) => {
                          return (
                            <Card
                              className="mt-1 mb-0 shadow-none border dz-processing dz-image-preview dz-success dz-complete"
                              key={i + "-file"}
                            >
                              <div className="p-2">
                                <Row className="align-items-center">
                                  <Col className="col-auto">
                                    <img
                                      data-dz-thumbnail=""
                                      height="80"
                                      className="avatar-sm rounded bg-light"
                                      alt={f.fileRaw?.name || f.caption}
                                      src={f.preview || f.path}
                                    />
                                  </Col>
                                  <Col>
                                    <Link
                                      to="#"
                                      className="text-muted font-weight-bold"
                                    >
                                      {f.fileRaw?.name || f.caption}
                                    </Link>
                                    {f.formattedSize && (
                                      <p className="mb-0">
                                        <strong>{f.formattedSize}</strong>
                                      </p>
                                    )}
                                  </Col>
                                </Row>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </Form>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <h6 className="fw-semibold mb-3">Departure Information</h6>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">City</Label>
                      <Select
                        placeholder="Select City"
                        onChange={value => {
                          handleSelectLocation(value, "departureLocation.city")
                        }}
                        onInputChange={value => {
                          handleSearchLocation(value, "departureLocation.city")
                        }}
                        options={locations}
                        classNamePrefix="select2-selection"
                        isLoading={true}
                      />
                    </div>
                  </Col>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Place</Label>
                      <input
                        value={formik.values.departureLocation.place}
                        name="departureLocation.place"
                        className="form-control"
                        type="text"
                        placeholder="Enter Place"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Date and Time</Label>
                      <InputGroup>
                        <Flatpickr
                          value={formik.values.departureTime}
                          className="form-control d-block"
                          placeholder="Select Date and Time"
                          options={{
                            enableTime: true,
                            altInput: true,
                            altFormat: "F j, Y, H:i",
                            dateFormat: "Y-m-d H:i",
                          }}
                          onChange={values =>
                            formik.setFieldValue("departureTime", values[0])
                          }
                        />
                      </InputGroup>
                    </div>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <h6 className="fw-semibold mb-3">Arrival Information</h6>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">City</Label>
                      <Select
                        placeholder="Select City"
                        onChange={value => {
                          handleSelectLocation(
                            value,
                            "destinationLocation.city",
                          )
                        }}
                        onInputChange={value => {
                          handleSearchLocation(
                            value,
                            "destinationLocation.city",
                          )
                        }}
                        options={locations}
                        classNamePrefix="select2-selection"
                        isLoading={true}
                      />
                    </div>
                  </Col>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Place</Label>
                      <input
                        value={formik.values.destinationLocation.place}
                        name="destinationLocation.place"
                        className="form-control"
                        type="text"
                        placeholder="Enter Place"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Date and Time</Label>
                      <InputGroup>
                        <Flatpickr
                          value={formik.values.arrivalTime}
                          className="form-control d-block"
                          placeholder="Select Date and Time"
                          options={{
                            enableTime: true,
                            altInput: true,
                            altFormat: "F j, Y, H:i",
                            dateFormat: "Y-m-d H:i",
                          }}
                          onChange={values =>
                            formik.setFieldValue("arrivalTime", values[0])
                          }
                        />
                      </InputGroup>
                    </div>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <h6 className="fw-semibold mb-3">Facilities</h6>
                  <Col md="12">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Seats Amount</Label>
                      <input
                        value={formik.values.facilities[0].name}
                        name="facilities[0].name"
                        className="form-control"
                        type="text"
                        placeholder="Enter Seats Amount"
                        onChange={formik.handleChange}
                      />
                      {/* <AvField
                        name="seatsAmount"
                        placeholder="Seats Amount"
                        type="number"
                        errorMessage="Enter Seats Amount"
                        className="form-control"
                        validate={{
                          required: { value: true },
                          pattern: {
                            value: "^[0-9]+$",
                            errorMessage: "Only Numbers",
                          },
                        }}
                        id="validationCustom02"
                      /> */}
                    </div>
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Seat Setting</Label>
                      <Select
                        value={formik.values.facilities[1].name}
                        onChange={selectedOption => {
                          formik.setFieldValue(
                            "facilities[1].name",
                            selectedOption,
                          )
                        }}
                        placeholder="Select Seat Setting"
                        options={seatSettingOptions}
                        classNamePrefix="select2-selection"
                      />
                    </div>
                    <div className="form-check mb-2 p-0">
                      {/* <input
                        className="form-check-input"
                        type="checkbox"
                        value={{ name: "WiFi", type: "wifi" }}
                        id="wifi"
                      />
                      <label className="form-check-label" htmlFor="wifi">
                        WiFi
                      </label> */}
                      <label className="control-label">Other Facilities</label>
                      <Select
                        value={selectedFacilities}
                        isMulti={true}
                        onChange={selectedFacilitiesItem => {
                          // console.log(selectedFacilitiesItem)
                          handleMultipleFacility(selectedFacilitiesItem)
                        }}
                        placeholder="Select Other Facilities"
                        options={otherFacilityOptions}
                        classNamePrefix="select2-selection"
                      />
                    </div>
                    {/* <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={{ name: "AC", type: "ac" }}
                        id="ac"
                      />
                      <label className="form-check-label" htmlFor="ac">
                        Full AC
                      </label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={{ name: "Entertainment", type: "entertainment" }}
                        id="entertainment"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="entertainment"
                      >
                        Hiburan
                      </label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={{ name: "Toilet", type: "toilet" }}
                        id="toilet"
                        onChange={e => console.log(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="toilet">
                        Toilet
                      </label>
                    </div> */}
                  </Col>
                </Row>

                <Row className="mt-4">
                  <h6 className="fw-semibold mb-3">Seats</h6>
                  <Col md="4">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Seat Column</Label>
                      <input
                        value={formik.values.seatColumn}
                        name="seatColumn"
                        className="form-control"
                        type="text"
                        placeholder="Enter Seat Column"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                  <Col md="4">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Seat Row</Label>
                      <input
                        value={formik.values.seatRow}
                        name="seatRow"
                        className="form-control"
                        type="text"
                        placeholder="Enter Seat Row"
                        onChange={formik.handleChange}
                      />
                    </div>
                  </Col>
                  <Col md="4">
                    <div className="mb-3">
                      <Label htmlFor="validationCustom03">Aisle Column</Label>
                      <input
                        value={formik.values.aisleColumn}
                        name="aisleColumn"
                        className="form-control"
                        type="text"
                        placeholder="Enter Seat Row"
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

export default connect(null, { setBreadcrumbItems })(FormEditBus)

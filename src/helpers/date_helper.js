import moment from "moment"

export const formatToDate = timestamp => {
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000)
}

export const formatToDateString = (timestamp, format) => {
  return moment(formatToDate(timestamp)).format(format)
}

export const formatToTime = timestamp => {
  const dateTime = new Date(
    timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000,
  )
  return moment(dateTime).format("HH:mm")
}

export const findDiffBetweenTwoTime = (firstTime, secondTime) => {
  return `${moment(secondTime).diff(moment(firstTime), "hours")}`
}

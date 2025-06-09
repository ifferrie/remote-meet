"use client"

import { useState, useEffect } from "react"
import moment from "moment-timezone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Plus, X, Calendar } from "lucide-react"

interface Participant {
  id: string
  name: string
  timezone: string
  workStart: string
  workEnd: string
}

interface TimeSlot {
  time: string
  participants: string[]
}

const TIMEZONES = [
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "America/Denver", label: "Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "Mumbai (IST)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
]

export default function TimeZoneScheduler() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    timezone: "",
    workStart: "09:00",
    workEnd: "17:00",
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const addParticipant = () => {
    if (newParticipant.name && newParticipant.timezone) {
      const participant: Participant = {
        id: Date.now().toString(),
        ...newParticipant,
      }
      setParticipants([...participants, participant])
      setNewParticipant({
        name: "",
        timezone: "",
        workStart: "09:00",
        workEnd: "17:00",
      })
    }
  }

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id))
  }

  const getTimeInTimezone = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  }

  const getDateInTimezone = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const isWorkingHour = (time: string, workStart: string, workEnd: string) => {
    const [hour, minute] = time.split(":").map(Number)
    const [startHour, startMinute] = workStart.split(":").map(Number)
    const [endHour, endMinute] = workEnd.split(":").map(Number)

    const timeMinutes = hour * 60 + minute
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes
  }

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = []
    const baseDate = new Date()

    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00`
      const testDate = new Date(baseDate)
      testDate.setHours(hour, 0, 0, 0)

      const availableParticipants = participants.filter((participant) => {
        const localTime = getTimeInTimezone(testDate, participant.timezone)
        return isWorkingHour(localTime, participant.workStart, participant.workEnd)
      })

      if (availableParticipants.length > 0) {
        slots.push({
          time,
          participants: availableParticipants.map((p) => p.name),
        })
      }
    }

    return slots.filter((slot) => slot.participants.length >= Math.min(2, participants.length))
  }

  const getBestMeetingTimes = () => {
    const slots = generateTimeSlots()
    return slots.sort((a, b) => b.participants.length - a.participants.length).slice(0, 3)
  }

  const createGoogleCalendarUrl = (slot: TimeSlot, date: Date = new Date()) => {
    const [hour] = slot.time.split(":").map(Number)
    const startDate = new Date(date)
    startDate.setHours(hour, 0, 0, 0)

    const endDate = new Date(startDate)
    endDate.setHours(hour + 1, 0, 0, 0) // 1-hour meeting

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    }

    const title = encodeURIComponent("Team Meeting")
    const details = encodeURIComponent(
      `Meeting with: ${slot.participants.join(", ")}\n\n` +
        `Local times:\n` +
        participants
          .map((p) => {
            const localTime = getTimeInTimezone(startDate, p.timezone)
            const localDate = getDateInTimezone(startDate, p.timezone)
            return `• ${p.name}: ${localTime} (${localDate})`
          })
          .join("\n"),
    )

    const attendees = encodeURIComponent(
      participants
        .filter((p) => slot.participants.includes(p.name))
        .map((p) => p.name.toLowerCase().replace(/\s+/g, "") + "@company.com")
        .join(","),
    )

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${details}&add=${attendees}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            TimeSync
          </h1>
          <p className="text-gray-600">Find the perfect meeting time across time zones</p>
        </div>

        {/* Add Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add Participants
            </CardTitle>
            <CardDescription>Add team members with their time zones and working hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="timezone">Time Zone</Label>
                <Select
                  value={newParticipant.timezone}
                  onValueChange={(value) => setNewParticipant({ ...newParticipant, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="workStart">Work Start</Label>
                <Input
                  id="workStart"
                  type="time"
                  value={newParticipant.workStart}
                  onChange={(e) => setNewParticipant({ ...newParticipant, workStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="workEnd">Work End</Label>
                <Input
                  id="workEnd"
                  type="time"
                  value={newParticipant.workEnd}
                  onChange={(e) => setNewParticipant({ ...newParticipant, workEnd: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addParticipant} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Participant
            </Button>
          </CardContent>
        </Card>

        {/* Participants List */}
        {participants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-gray-600">
                        {getTimeInTimezone(currentTime, participant.timezone)} •{" "}
                        {getDateInTimezone(currentTime, participant.timezone)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Work: {participant.workStart} - {participant.workEnd}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeParticipant(participant.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Overlap Visualization */}
        {participants.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Time Overlap Analysis</CardTitle>
              <CardDescription>Visual representation of overlapping working hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{participant.name}</span>
                      <span className="text-sm text-gray-600">
                        {TIMEZONES.find((tz) => tz.value === participant.timezone)?.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const testDate = new Date()
                        testDate.setHours(hour, 0, 0, 0)
                        const localTime = getTimeInTimezone(testDate, participant.timezone)
                        const isWorking = isWorkingHour(localTime, participant.workStart, participant.workEnd)

                        return (
                          <div
                            key={hour}
                            className={`h-8 flex-1 rounded-sm flex items-center justify-center text-xs ${
                              isWorking ? "bg-green-200 text-green-800" : "bg-gray-100 text-gray-400"
                            }`}
                            title={`${hour}:00 UTC = ${localTime} local`}
                          >
                            {hour}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested Meeting Times */}
        {participants.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Suggested Meeting Times
              </CardTitle>
              <CardDescription>Click on any option to create a Google Calendar event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getBestMeetingTimes().map((slot, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    onClick={() => window.open(createGoogleCalendarUrl(slot), "_blank")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-lg group-hover:text-blue-700">
                        Option {index + 1}: {slot.time} UTC
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {slot.participants.length}/{participants.length} available
                        </Badge>
                        <div className="text-xs text-gray-500 group-hover:text-blue-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Click to add to calendar
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {participants.map((participant) => {
                        const testDate = new Date()
                        const [hour] = slot.time.split(":").map(Number)
                        testDate.setHours(hour, 0, 0, 0)
                        const localTime = getTimeInTimezone(testDate, participant.timezone)
                        const isAvailable = slot.participants.includes(participant.name)

                        return (
                          <div
                            key={participant.id}
                            className={`p-2 rounded text-sm ${
                              isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            <div className="font-medium">{participant.name}</div>
                            <div>{localTime} local</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {getBestMeetingTimes().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No overlapping time slots found.</p>
                    <p className="text-sm">Try adjusting work hours or adding more participants.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {participants.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Get Started</h3>
              <p className="text-gray-600 mb-4">Add at least 2 participants to find overlapping meeting times</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

import {
  Cloud,
  FileText,
  FolderSearch,
  HardDrive,
  Upload,
  FolderOpen,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export function CloudStoragePage() {
  const chartData = [
    { name: 'Used', value: 75, color: '#2563eb' },
    { name: 'Remaining', value: 25, color: '#e5eeff' },
  ]

  const recentUploads = [
    {
      id: 1,
      name: 'Advanced_Calculus_Ch4.pdf',
      size: '2.4 MB',
      time: 'Just now',
      type: 'pdf',
      icon: FileText,
      iconColor: 'text-[#ef4444]',
      bgColor: 'bg-[#fee2e2]',
    },
    {
      id: 2,
      name: 'History_Midterm_Notes.docx',
      size: '1.1 MB',
      time: '2 hours ago',
      type: 'doc',
      icon: FileText,
      iconColor: 'text-[#3b82f6]',
      bgColor: 'bg-[#dbeafe]',
    },
    {
      id: 3,
      name: 'Lab_Results_Dataset.xlsx',
      size: '4.8 MB',
      time: 'Yesterday',
      type: 'xls',
      icon: FileSpreadsheet,
      iconColor: 'text-[#22c55e]',
      bgColor: 'bg-[#dcfce7]',
    },
  ]

  const subjects = [
    { name: 'Computer Science', size: '45 GB', progress: 45, color: '#2563eb' },
    { name: 'Mathematics', size: '15 GB', progress: 15, color: '#8b5cf6' },
    { name: 'Literature', size: '8 GB', progress: 8, color: '#0f766e' },
  ]

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cloud Storage</h1>
          <p className="text-muted mt-2 text-sm">
            Manage your study files and storage space in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="gap-2">
            <Trash2 className="size-4" />
            Clean Up<br className="hidden md:block"/>Storage
          </Button>
          <Button variant="secondary" className="gap-2">
            <FolderSearch className="size-4" />
            Storage<br className="hidden md:block"/>Explorer
          </Button>
          <Button variant="primary" className="gap-2 bg-[#1e40af] hover:bg-[#1e40af]/90">
            <Upload className="size-4" />
            Upload<br className="hidden md:block"/>File
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <HardDrive className="size-4 text-primary" />
              Total Storage
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">100 GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <FileText className="size-4 text-[#8b5cf6]" />
              Used Storage
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">75 GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <Cloud className="size-4 text-[#0ea5e9]" />
              Remaining
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">25 GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <FolderOpen className="size-4 text-[#2563eb]" />
              Shared Files
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">1.2 GB</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Uploads */}
        <Card className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold text-foreground text-[15px]">Recent Uploads</h2>
            <button className="text-primary text-sm font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="flex flex-col">
            {recentUploads.map((file, i) => (
              <div
                key={file.id}
                className={`flex items-center gap-4 p-5 ${
                  i !== recentUploads.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className={`p-2.5 rounded-lg ${file.bgColor}`}>
                  <file.icon className={`size-6 ${file.iconColor}`} />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="font-medium text-foreground text-[15px]">
                    {file.name}
                  </span>
                  <span className="text-muted text-xs mt-0.5">
                    {file.size} • {file.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column - Usage and Subjects */}
        <div className="flex flex-col gap-6">
          {/* Usage Circle Chart Card */}
          <Card className="flex flex-col items-center text-center p-6 pb-8">
            <div className="w-[160px] h-[160px] relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={55}
                    outerRadius={75}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-foreground">75%</span>
              </div>
            </div>
            
            <h3 className="font-bold text-foreground text-[15px] mt-4">
              75 GB of 100 GB used
            </h3>
            <p className="text-muted text-xs mt-1.5 mb-6 max-w-[200px]">
              You're approaching your limit.
            </p>
            
            <Button variant="secondary" className="w-full text-[#1e40af] bg-[#f0f4ff] border-none hover:bg-[#e0e8ff]">
              Manage Storage
            </Button>
          </Card>

          {/* Storage by Subject Card */}
          <Card>
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-foreground text-[15px]">Storage by Subject</h2>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {subjects.map((subject) => (
                <div key={subject.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-body">{subject.name}</span>
                    <span className="text-muted">{subject.size}</span>
                  </div>
                  <div className="w-full bg-[#f1f3f5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${subject.progress}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Content = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const contentItems = [
    {
      id: 1,
      title: 'Getting Started Guide',
      category: 'Documentation',
      author: 'John Doe',
      status: 'Published',
      views: 1250,
      lastModified: '2026-01-05',
      type: 'Article',
    },
    {
      id: 2,
      title: 'Best Practices for Interviews',
      category: 'Tutorial',
      author: 'Jane Smith',
      status: 'Draft',
      views: 0,
      lastModified: '2026-01-06',
      type: 'Guide',
    },
    {
      id: 3,
      title: 'Interview Questions Library',
      category: 'Resource',
      author: 'Mike Johnson',
      status: 'Published',
      views: 3420,
      lastModified: '2026-01-03',
      type: 'Collection',
    },
    {
      id: 4,
      title: 'Company Culture Guide',
      category: 'Documentation',
      author: 'Sarah Wilson',
      status: 'Published',
      views: 890,
      lastModified: '2026-01-04',
      type: 'Article',
    },
    {
      id: 5,
      title: 'Technical Interview Tips',
      category: 'Tutorial',
      author: 'David Brown',
      status: 'Published',
      views: 2100,
      lastModified: '2026-01-02',
      type: 'Guide',
    },
    {
      id: 6,
      title: 'Remote Interview Guide',
      category: 'Resource',
      author: 'Emily Davis',
      status: 'Draft',
      views: 0,
      lastModified: '2026-01-07',
      type: 'Article',
    },
  ];

  const filteredContent = contentItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    if (status === 'Published') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
        {status}
      </span>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      Documentation: 'bg-blue-100 text-blue-700 border-blue-200',
      Tutorial: 'bg-purple-100 text-purple-700 border-purple-200',
      Resource: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return colors[category] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Content Management</h1>
          <p className="text-slate-600 mt-1">Manage your content library and resources</p>
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Content
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Content</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{contentItems.length}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Published</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {contentItems.filter(item => item.status === 'Published').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Drafts</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {contentItems.filter(item => item.status === 'Draft').length}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Edit className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Views</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  {contentItems.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search content by title or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-xl"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Content</CardTitle>
          <CardDescription>Manage and organize your content library</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <div className="font-medium text-slate-900">{item.title}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.author}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.type}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">
                    {item.views.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.lastModified}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredContent.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No content found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Grid View (Alternative) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.slice(0, 3).map((item) => (
          <Card key={`card-${item.id}`} className="hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                  {item.category}
                </span>
                {getStatusBadge(item.status)}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 mb-4">
                Type: <span className="font-medium">{item.type}</span> • By {item.author}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {item.views}
                  </span>
                  <span>{item.lastModified}</span>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Content;

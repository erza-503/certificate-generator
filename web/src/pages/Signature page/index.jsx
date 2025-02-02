import MainLayout from "../MainLayout/Layout";
import { Signature } from "../api middleware";
import { message, Table, Col, Row, Button, Input, Modal, Form } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";

const SignaturePage = () => {
  const [loading, setLoading] = useState(false); // Untuk indikasi loading data
  const [data, setData] = useState([]); // Menyimpan data dari API
  const [searchText, setSearchText] = useState(""); // Filter pencarian
  const [isEditModalVisible, setIsEditModalVisible] = useState(false); // Status modal edit
  const [editData, setEditData] = useState(null); // Data yang sedang diedit
  const { control, handleSubmit, reset } = useForm(); // React Hook Form
  const navigate = useNavigate();
  const { confirm } = Modal;

  // Filter Data Berdasarkan Pencarian
  const filteredData = data.filter((item) =>
    item.config_name?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Ambil Data dari API saat halaman dimuat
  useEffect(() => {
    const fetchSignature = async () => {
      setLoading(true);
      try {
        const response = await Signature.get("/");
        const datas = response.data.data;
        const filterData = datas.filter((item) => !item.deleted_at);
        setData(filterData);
      } catch (error) {
        console.error("Error fetching signature:", error);
        message.error("Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };
    fetchSignature();
  }, []);

 // Hapus data paraf dan beritahu pengguna hasil penghapusan data paraf
 const delHandle = async (_id) => {
   try {
     await Signature.delete(`/${_id}`);
     setData((prevData) => prevData.filter((item) => item._id !== _id));
     message.success("Data berhasil dihapus");
   } catch (error) {
     console.error("Error response:", error.response);
     message.error(
       `Gagal menghapus data: ${error.response?.data?.message || error.message}`
     );
   }
 };

  // Konfirmasi penghapusan data paraf
  const delConfirm = (_id, config_name) => {
    confirm({
      title: `Apakah Anda yakin ingin menghapus paraf "${config_name}"?`,
      content: "Data yang dihapus tidak dapat dikembalikan.",
      okType: "danger",
      okText: "Ya, hapus",
      cancelText: "Batal",
      onOk() {
        delHandle(_id);
      },
    });
  };

  // Navigasi ke Halaman Pembuatan Sertifikat
  const createNav = () => {
    navigate("/createParaf");
  };

  // Buka Modal Edit dengan Data yang Dipilih
  const handleEdit = async (record) => {
    try {
      const response = await Signature.get(`/${record._id}`);
      const certificateData = response.data.data;

      setEditData(certificateData);
      reset({
        displayNama: certificateData.config_name || "",
        atasNama: certificateData.name || "",
        jabatan: certificateData.role || "",
        linkLogo: certificateData.logo || "",
        ttd: certificateData.signature || "",
        Cap: certificateData.stamp || "",
      });

      setIsEditModalVisible(true);
    } catch (error) {
      console.error("Error fetching certificate details:", error);
      message.error("Gagal mengambil data paraf.");
    }
  };

  // Simpan Perubahan Data
  const onSubmit = async (formData) => {
    try {
      const updatedData = {
        ...editData,
        ...formData,
        signature: formData.ttd,
        stamp: formData.Cap,
        name: formData.atasNama,
        config_name: formData.displayNama,
        role: formData.jabatan,
      };

      await Signature.put(`/${editData._id}`, updatedData);

      setData((prevData) =>
        prevData.map((item) => (item._id === editData._id ? updatedData : item))
      );

      message.success("Data berhasil diperbarui");
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Error updating data:", error);
      message.error("Gagal memperbarui data.");
    }
  };

  // Kolom Tabel
  const columns = [
    {
      title: "No",
      align: "center",
      width: 100,
      render: (text, record, index) => index + 1,
    },
    {
      title: "Signature",
      align: "center",
      dataIndex: "config_name",
      key: "config_name",
    },
    {
      width: 300,
      title: "Aksi",
      align: "center",
      render: (Text, record) => (
        <>
          <Button
            icon={<DeleteOutlined />}
            type="primary"
            danger
            onClick={() => delConfirm(record._id, record.config_name)}
            style={{ margin: 8 }}
          />
          <Button
            icon={<EditOutlined />}
            type="primary"
            onClick={() => handleEdit(record)}
            style={{ margin: 8 }}
          />
        </>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center w-full lg:w-3/4 p-5">
        <p className="text-xl font-Poppins font-semibold mb-5 text-Text p-3 bg-white rounded-xl">
          Daftar Paraf
        </p>

        <Button onClick={createNav} className="m-3">
          Buat Paraf
        </Button>

        <Input
          placeholder="Search signature"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="mb-4 p-2 border rounded md:w-1/2"
        />

        <Row
          style={{ justifyContent: "center", width: "100%", overflowX: "auto" }}
        >
          <Col span={24}>
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="_id"
              pagination={false}
              bordered
              loading={loading}
              scroll={{
                x: "max-content",
                y: filteredData.length > 6 ? 500 : undefined,
              }}
            />
          </Col>
        </Row>
      </div>

      {/* Modal Edit */}
      <Modal
        title="Edit Data"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label="Display Nama" required>
            <Controller
              name="displayNama"
              control={control}
              rules={{ required: "Wajib mengisi Display Nama" }}
              render={({ field }) => (
                <Input {...field} placeholder="Masukkan Display Nama" />
              )}
            />
          </Form.Item>

          <Form.Item label="Nama Penandatangan" required>
            <Controller
              name="atasNama"
              control={control}
              rules={{ required: "Wajib mengisi Nama Penandatangan" }}
              render={({ field }) => (
                <Input {...field} placeholder="Masukkan Nama Penandatangan" />
              )}
            />
          </Form.Item>

          <Form.Item label="Jabatan Penandatangan" required>
            <Controller
              name="jabatan"
              control={control}
              rules={{ required: "Wajib mengisi Jabatan Penandatangan" }}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Masukkan Jabatan Penandatangan"
                />
              )}
            />
          </Form.Item>

          <Form.Item label="Link Gambar Tanda Tangan" required>
            <Controller
              name="ttd"
              control={control}
              rules={{ required: "Wajib mengisi Link Gambar Tanda Tangan" }}
              render={({ field }) => (
                <>
                  <Input {...field} placeholder="Masukkan Link Gambar Tanda Tangan" />
                  {field.value && (
                    <div style={{ marginTop: "10px" }}>
                      <img
                        src={field.value}
                        alt="Tanda tangan orang terkait"
                        style={{
                          height: "200px",
                          border: "solid",
                          borderColor: "black",
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            />
          </Form.Item>

          <Form.Item label="Link Gambar Cap Perusahaan" required>
            <Controller
              name="Cap"
              control={control}
              rules={{ required: "Wajib mengisi Link Gambar Cap Perusahaan" }}
              render={({ field }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Masukkan Link Gambar Cap Perusahaan"
                  />
                  {field.value && (
                    <div style={{ marginTop: "10px" }}>
                      <img
                        src={field.value}
                        alt="Cap Perusahaan"
                        style={{
                          height: "200px",
                          border: "solid",
                          borderColor: "black",
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            />
          </Form.Item>

          <Form.Item label="Link Gambar Logo Perusahaan" required>
            <Controller
              name="linkLogo"
              control={control}
              rules={{ required: "Wajib mengisi Link Gambar Logo Perusahaan" }}
              render={({ field }) => (
                <>
                  <Input
                    {...field}
                    placeholder="Masukkan Link Gambar Logo Perusahaan"
                    style={{ width: "100%", height: "50px" }}
                  />
                  {/* Menampilkan gambar dari link yang dimasukkan */}
                  {field.value && (
                    <div style={{ marginTop: "10px" }}>
                      <img
                        src={field.value}
                        alt="Logo Perusahaan"
                        style={{
                          height: "200px",
                          border: "solid",
                          borderColor: "black",
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%", height: "50px" }}
            >
              Simpan
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default SignaturePage;
